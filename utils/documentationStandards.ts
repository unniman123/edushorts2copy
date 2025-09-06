/**
 * JSDoc Documentation Standards for React Native Expo Project
 * 
 * This file defines the standardized documentation patterns and templates
 * to ensure consistent, comprehensive documentation across the codebase.
 * 
 * @fileoverview Documentation standards and templates for services, components, hooks, and contexts
 * @author Development Team
 * @version 1.0.0
 */

/**
 * Documentation Standards and Templates
 * 
 * This module provides standardized JSDoc templates and patterns
 * for documenting React Native Expo application code.
 */

/**
 * Service Class Documentation Template
 * 
 * All service classes should follow this documentation pattern:
 * - Class-level description with purpose and architecture context
 * - Method-level documentation with parameters, returns, and examples
 * - Error conditions and throws documentation
 * - Usage examples for complex methods
 */
export const SERVICE_DOCUMENTATION_TEMPLATE = `
/**
 * ServiceName - Brief description of the service purpose
 * 
 * Detailed description of what this service does, its responsibilities,
 * and how it fits into the overall application architecture.
 * 
 * @class ServiceName
 * @extends {BaseService}
 * @example
 * const service = ServiceName.getInstance();
 * await service.initialize();
 * const result = await service.someMethod(params);
 */
class ServiceName extends BaseService {
  /**
   * Gets the singleton instance of the service
   * @returns {ServiceName} The singleton instance
   * @static
   * @memberof ServiceName
   */
  static getInstance(): ServiceName {
    return super.getInstance() as ServiceName;
  }

  /**
   * Initializes the service with required dependencies
   * @param {DependencyType} dependency - Description of the dependency
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   * @throws {Error} When initialization fails
   * @memberof ServiceName
   */
  async initialize(dependency: DependencyType): Promise<void> {
    // Implementation
  }

  /**
   * Method description with clear purpose and behavior
   * @param {ParamType} param - Description of parameter
   * @param {OptionalType} [optionalParam] - Description of optional parameter
   * @returns {Promise<ReturnType>} Description of return value
   * @throws {Error} When specific error conditions occur
   * @memberof ServiceName
   * @example
   * const result = await service.methodName(requiredParam, optionalParam);
   */
  async methodName(param: ParamType, optionalParam?: OptionalType): Promise<ReturnType> {
    // Implementation
  }
}
`;

/**
 * React Component Documentation Template
 * 
 * All React components should follow this documentation pattern:
 * - Component purpose and behavior description
 * - Props interface documentation
 * - Usage examples with practical scenarios
 * - Accessibility considerations when relevant
 */
export const COMPONENT_DOCUMENTATION_TEMPLATE = `
/**
 * ComponentName - Brief description of component purpose
 * 
 * Detailed description of what this component renders, its behavior,
 * and any important usage notes or accessibility considerations.
 * 
 * @component
 * @param {ComponentNameProps} props - Component properties
 * @returns {React.ReactElement} The rendered component
 * 
 * @example
 * <ComponentName
 *   requiredProp="value"
 *   optionalProp={optionalValue}
 *   onAction={handleAction}
 * />
 */

/**
 * Props interface for ComponentName
 * @interface ComponentNameProps
 */
interface ComponentNameProps {
  /** Required prop description */
  requiredProp: string;
  /** Optional prop description */
  optionalProp?: number;
  /** Callback function description */
  onAction: (param: ParamType) => void;
}

const ComponentName: React.FC<ComponentNameProps> = memo(({
  requiredProp,
  optionalProp,
  onAction
}) => {
  // Component implementation
});
`;

/**
 * Custom Hook Documentation Template
 * 
 * All custom hooks should follow this documentation pattern:
 * - Hook purpose and state management description
 * - Parameters and return type documentation
 * - Side effects and dependencies explanation
 * - Usage examples with common patterns
 */
export const HOOK_DOCUMENTATION_TEMPLATE = `
/**
 * useHookName - Brief description of hook purpose
 * 
 * Detailed description of what this hook does, what state it manages,
 * and any side effects or dependencies it has.
 * 
 * @hook
 * @param {ParamType} param - Description of parameter
 * @param {OptionalType} [optionalParam] - Description of optional parameter
 * @returns {HookReturnType} Object containing hook state and methods
 * 
 * @example
 * const { data, loading, error, refetch } = useHookName(param, optionalParam);
 */

/**
 * Return type for useHookName hook
 * @interface HookReturnType
 */
interface HookReturnType {
  /** Current data state */
  data: DataType | null;
  /** Loading state indicator */
  loading: boolean;
  /** Error state if any */
  error: Error | null;
  /** Function to refetch data */
  refetch: () => Promise<void>;
}

export const useHookName = (
  param: ParamType,
  optionalParam?: OptionalType
): HookReturnType => {
  // Hook implementation
};
`;

/**
 * React Context Documentation Template
 * 
 * All React contexts should follow this documentation pattern:
 * - Context purpose and state management description
 * - Provider component documentation
 * - Consumer hook documentation with error handling
 * - Usage patterns and best practices
 */
export const CONTEXT_DOCUMENTATION_TEMPLATE = `
/**
 * ContextName - Brief description of context purpose
 * 
 * Detailed description of what state this context manages,
 * what components should use it, and any important usage patterns.
 * 
 * @context
 */

/**
 * Context type definition for ContextName
 * @interface ContextNameType
 */
interface ContextNameType {
  /** State property description */
  state: StateType;
  /** Action method description */
  action: (param: ParamType) => Promise<void>;
}

/**
 * Context instance for ContextName
 * @type {React.Context<ContextNameType | undefined>}
 */
const ContextNameContext = createContext<ContextNameType | undefined>(undefined);

/**
 * Provider component for ContextName
 * 
 * @component
 * @param {Object} props - Provider properties
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement} The provider component
 */
export function ContextNameProvider({ children }: { children: React.ReactNode }) {
  // Provider implementation
}

/**
 * Hook to access ContextName context
 * 
 * @hook
 * @returns {ContextNameType} The context value
 * @throws {Error} When used outside of ContextNameProvider
 * 
 * @example
 * const { state, action } = useContextName();
 */
export function useContextName(): ContextNameType {
  const context = useContext(ContextNameContext);
  if (context === undefined) {
    throw new Error('useContextName must be used within a ContextNameProvider');
  }
  return context;
}
`;

/**
 * Utility Function Documentation Template
 * 
 * All utility functions should follow this documentation pattern:
 * - Function purpose and behavior description
 * - Parameters and return value documentation
 * - Error conditions and side effects
 * - Practical usage examples
 */
export const UTILITY_DOCUMENTATION_TEMPLATE = `
/**
 * functionName - Brief description of function purpose
 * 
 * Detailed description of what this function does, any side effects,
 * and important behavior notes.
 * 
 * @function
 * @param {ParamType} param - Description of parameter
 * @param {OptionalType} [optionalParam] - Description of optional parameter
 * @returns {ReturnType} Description of return value
 * @throws {Error} When specific error conditions occur
 * 
 * @example
 * const result = functionName(param, optionalParam);
 */
export function functionName(
  param: ParamType,
  optionalParam?: OptionalType
): ReturnType {
  // Function implementation
}
`;

/**
 * TypeScript Interface Documentation Template
 * 
 * All complex interfaces should follow this documentation pattern:
 * - Interface purpose and usage context
 * - Property descriptions with types
 * - Method signatures when applicable
 * - Usage examples with practical scenarios
 */
export const INTERFACE_DOCUMENTATION_TEMPLATE = `
/**
 * InterfaceName - Brief description of interface purpose
 * 
 * Detailed description of what this interface represents,
 * where it's used, and any important constraints or relationships.
 * 
 * @interface InterfaceName
 * @extends {BaseInterface}
 * 
 * @example
 * const example: InterfaceName = {
 *   requiredProp: 'value',
 *   optionalProp: 123
 * };
 */
export interface InterfaceName extends BaseInterface {
  /** Required property description */
  requiredProp: string;
  
  /** Optional property description */
  optionalProp?: number;
  
  /** Method signature description */
  methodName: (param: ParamType) => ReturnType;
}
`;

/**
 * Documentation Quality Standards
 * 
 * Required documentation elements for all code:
 * 1. Purpose - Clear, concise description of what the code does
 * 2. Parameters - All parameters with types and descriptions
 * 3. Return Values - What the function/method returns
 * 4. Examples - Practical usage examples
 * 5. Errors - When and what errors might be thrown
 * 6. Side Effects - Any state changes or external effects
 * 7. Dependencies - Required services or contexts
 * 8. Usage Context - Where and how to use the code
 */
export const DOCUMENTATION_QUALITY_STANDARDS = {
  REQUIRED_ELEMENTS: [
    'Purpose',
    'Parameters',
    'Return Values',
    'Examples',
    'Errors',
    'Side Effects',
    'Dependencies',
    'Usage Context'
  ],
  BEST_PRACTICES: [
    'Use clear, descriptive language',
    'Include practical examples',
    'Document error conditions',
    'Explain complex logic',
    'Reference related components/services',
    'Update documentation when code changes',
    'Use consistent formatting and structure'
  ],
  JSDOC_TAGS: {
    '@param': 'Parameter description',
    '@returns': 'Return value description',
    '@throws': 'Error conditions',
    '@example': 'Usage examples',
    '@component': 'React component',
    '@hook': 'Custom hook',
    '@context': 'React context',
    '@interface': 'TypeScript interface',
    '@memberof': 'Class member',
    '@static': 'Static method',
    '@async': 'Async function',
    '@deprecated': 'Deprecated code',
    '@since': 'Version added',
    '@see': 'Related references'
  }
} as const;

/**
 * Documentation Standards Configuration
 * 
 * Version and metadata for the documentation standards system.
 */
export const DOCUMENTATION_STANDARDS = {
  VERSION: '1.0.0',
  LAST_UPDATED: new Date().toISOString(),
  TEMPLATES_AVAILABLE: [
    'SERVICE_CLASS',
    'REACT_COMPONENT', 
    'CUSTOM_HOOK',
    'REACT_CONTEXT',
    'UTILITY_FUNCTION',
    'TYPESCRIPT_INTERFACE'
  ]
} as const; 