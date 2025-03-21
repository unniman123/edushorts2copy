import Migration, { createArticleMigrationStep } from './migration';
import { monitoringService } from '../services/monitoring';
import { supabase } from '../utils/supabase';

async function validateConnection() {
  try {
    const { data, error } = await supabase.from('news').select('id').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
}

async function runMigration() {
  console.log('Starting news system migration...');

  // Validate database connection
  const isConnected = await validateConnection();
  if (!isConnected) {
    console.error('Database connection failed. Aborting migration.');
    process.exit(1);
  }

  const startTime = Date.now();
  
  try {
    const migration = new Migration();
    
    // Add migration steps
    await migration.addStep(createArticleMigrationStep());
    
    // Execute migration
    const report = await migration.execute();
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Log results
    console.log('\nMigration completed successfully');
    console.log('Duration:', Math.round(duration / 1000), 'seconds');
    console.log('Steps completed:', report.steps.length);
    console.log('Validation results:', report.validation.length);
    
    // Track successful migration
    await monitoringService.trackInteraction(
      'news_system_migration',
      duration,
      {
        status: 'success',
        startTime: report.startTime,
        endTime: report.endTime,
        stepCount: report.steps.length,
        validationResults: report.validation.map(v => v.status),
      }
    );

    // Print detailed report
    console.log('\nDetailed Report:');
    console.log(JSON.stringify(report, null, 2));
  } catch (error: any) {
    console.error('\nMigration failed:', error.message);
    
    // Track migration failure
    await monitoringService.trackError({
      type: 'runtime',
      message: 'News system migration failed',
      stack: error.stack || '',
    });
    
    process.exit(1);
  }
}

// Check if running directly (not imported)
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
