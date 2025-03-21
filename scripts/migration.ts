import { supabase } from '../utils/supabase';
import type { Article } from '../types/supabase';
import { monitoringService } from '../services/monitoring';

interface MigrationStep {
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  validate: () => Promise<ValidationResult>;
}

interface ValidationResult {
  status: 'success' | 'error';
  details: Record<string, any>;
  timestamp: string;
}

interface MigrationReport {
  startTime: string;
  endTime: string;
  steps: {
    name: string;
    status: 'success' | 'error';
    duration: number;
    error?: string;
  }[];
  validation: ValidationResult[];
}

class Migration {
  private steps: MigrationStep[] = [];
  private report: MigrationReport = {
    startTime: '',
    endTime: '',
    steps: [],
    validation: [],
  };

  async addStep(step: MigrationStep) {
    this.steps.push(step);
  }

  async execute(): Promise<MigrationReport> {
    this.report.startTime = new Date().toISOString();
    let error = null;

    try {
      for (const step of this.steps) {
        const startTime = Date.now();
        try {
          await step.up();
          const validationResult = await step.validate();
          this.report.validation.push(validationResult);

          if (validationResult.status === 'error') {
            throw new Error(`Validation failed for step: ${step.name}`);
          }

          this.report.steps.push({
            name: step.name,
            status: 'success',
            duration: Date.now() - startTime,
          });
        } catch (e: any) {
          error = e as Error;
          this.report.steps.push({
            name: step.name,
            status: 'error',
            duration: Date.now() - startTime,
            error: e.message,
          });
          // Attempt rollback
          await this.rollback(this.steps.indexOf(step));
          break;
        }
      }
    } finally {
      this.report.endTime = new Date().toISOString();
      await this.saveReport();
    }

    if (error) {
      throw error;
    }

    return this.report;
  }

  private async rollback(fromIndex: number) {
    // Rollback in reverse order
    for (let i = fromIndex; i >= 0; i--) {
      const step = this.steps[i];
      try {
        await step.down();
      } catch (e: any) {
        // Log rollback error but continue with other rollbacks
        console.error(`Rollback failed for step ${step.name}:`, e);
        await monitoringService.trackError({
          type: 'runtime',
          message: `Rollback failed for step ${step.name}`,
          stack: e.stack || '',
        });
      }
    }
  }

  private async saveReport() {
    try {
      await supabase
        .from('migration_logs')
        .insert([
          {
            report: this.report,
            created_at: new Date().toISOString(),
          },
        ]);
    } catch (e) {
      console.error('Failed to save migration report:', e);
      // Don't throw here as this is a non-critical operation
    }
  }
}

// Example migration step for articles
export const createArticleMigrationStep = (): MigrationStep => ({
  name: 'article_migration',
  up: async () => {
    const { data: articles, error } = await supabase
      .from('news')
      .select('*')
      .eq('status', 'published');

    if (error) throw error;

    // Process in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      await processArticleBatch(batch);
    }
  },
  down: async () => {
    // Implement rollback logic
    await supabase.from('news').delete().gt('id', 0);
  },
  validate: async () => {
    const { count: sourceCount } = await supabase
      .from('news')
      .select('*', { count: 'exact', head: true });

    const { count: targetCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });

    return {
      status: sourceCount === targetCount ? 'success' : 'error',
      details: {
        sourceCount,
        targetCount,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  },
});

async function processArticleBatch(articles: Article[]) {
  const { error } = await supabase.from('articles').insert(
    articles.map((article) => ({
      ...article,
      migrated_at: new Date().toISOString(),
      migration_version: '1.0.0',
    }))
  );

  if (error) throw error;
}

// Export the Migration class for use in scripts
export default Migration;
