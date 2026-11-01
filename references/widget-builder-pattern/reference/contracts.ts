/** Framework-independent contracts for a dashboard and widget builder. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type Parameters = Record<string, JsonValue>;
export type WidgetKind = "metric" | "table" | "launcher";
export type Breakpoint = "wide" | "medium" | "narrow";

export interface Option {
  value: string;
  label: string;
}

interface ParameterBase {
  key: string;
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: JsonValue;
}

export type ParameterDefinition = ParameterBase &
  (
    | { type: "text"; minLength?: number; maxLength?: number }
    | { type: "number"; integer?: boolean; min?: number; max?: number }
    | { type: "boolean" }
    | { type: "date" }
    | {
        type: "select" | "multiselect";
        options: Option[];
        lookupKey?: never;
      }
    | {
        type: "select" | "multiselect";
        lookupKey: string;
        dependsOn?: string[];
        options?: never;
      }
  );

export interface ColumnDefinition {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "date";
}

export interface SourceDefinition {
  id: string;
  revision: string;
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  columns: ColumnDefinition[];
  rowLabel: string;
  capabilities: {
    tabular: true;
    authoritativeRowCount: boolean;
    countOnly: boolean;
    resultPaging: boolean;
    cancellation: boolean;
  };
}

/** Capability flags are presentation hints; the service checks authorization. */
export interface SourceAccess {
  canDiscover: boolean;
  canExecute: boolean;
  canSchedule: boolean;
  canManage: boolean;
}

interface WidgetBase {
  id: string;
  title: string;
  sourceId: string;
  sourceRevision: string;
  savedParameters: Parameters;
  resultSetId?: string;
}

export type WidgetDefinition = WidgetBase &
  (
    | { kind: "metric"; presentation: { label?: string } }
    | {
        kind: "table";
        presentation: {
          visibleColumns: string[];
          previewRows: number;
          density: "comfortable" | "compact";
        };
      }
    | { kind: "launcher"; presentation: { description?: string } }
  );

export interface GridPlacement {
  widgetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SizeConstraints {
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface DashboardDefinition {
  id: string;
  revision: string;
  title: string;
  widgets: WidgetDefinition[];
  layouts: Record<Breakpoint, GridPlacement[]>;
}

export interface EditSession {
  baseRevision: string;
  draft: DashboardDefinition;
  dirty: boolean;
}

export interface ExecutionInput {
  sourceId: string;
  sourceRevision: string;
  resultSetId?: string;
  resolvedParameters: Parameters;
}

export interface ExecutionRequest extends ExecutionInput {
  clientRequestId: string;
  mode: "rows" | "count";
}

/** The server sets the access context and validates it on result retrieval. */
export interface ExecutionSnapshot extends ExecutionInput {
  executionId: string;
  completedAt: string;
  accessScopeRef: string;
  result: ResultSummary;
}

export interface ResultSummary {
  /** Complete matching count, only when authoritatively known. */
  totalRows: number | null;
  /** Rows retained/returned by the service, independent of the visible page. */
  returnedRows: number;
  truncated: boolean;
  hasRows: boolean;
  resultRef: string | null;
}

export interface ExecutionAttempt extends ExecutionInput {
  clientRequestId: string;
  executionId?: string;
  startedAt: string;
}

export type WidgetRuntimeState =
  | { status: "unrun" }
  | { status: "needs-configuration"; message: string }
  | {
      status: "queued" | "running";
      attempt: ExecutionAttempt;
      previous?: ExecutionSnapshot;
    }
  | { status: "succeeded"; current: ExecutionSnapshot }
  | {
      status: "failed";
      attempt: ExecutionAttempt;
      message: string;
      previous?: ExecutionSnapshot;
    }
  | {
      status: "canceled";
      attempt: ExecutionAttempt;
      previous?: ExecutionSnapshot;
    }
  | { status: "unavailable"; message: string };

export type ExecutionUpdate =
  | { status: "queued" | "running"; executionId: string }
  | { status: "succeeded"; snapshot: ExecutionSnapshot }
  | { status: "failed"; executionId: string; message: string }
  | { status: "canceled"; executionId: string };

export interface ResultPage {
  executionId: string;
  columns: ColumnDefinition[];
  rows: Record<string, JsonValue>[];
  nextCursor: string | null;
}

export interface ValidationIssue {
  parameterKey?: string;
  message: string;
}

export type ValidationResult =
  | { valid: true; normalized: Parameters }
  | { valid: false; issues: ValidationIssue[] };

/**
 * Async iteration represents status delivery without prescribing polling,
 * events, or a synchronous backend. An aborted client signal is not proof
 * of server cancellation.
 */
export interface SourceAdapter {
  describe(sourceId: string): Promise<SourceDefinition>;
  validate(sourceId: string, parameters: Parameters): Promise<ValidationResult>;
  execute(
    request: ExecutionRequest,
    signal?: AbortSignal
  ): AsyncIterable<ExecutionUpdate>;
  readPage(
    executionId: string,
    cursor?: string,
    signal?: AbortSignal
  ): Promise<ResultPage>;
  cancel?(executionId: string): Promise<{ confirmed: boolean }>;
}

export interface RendererDefinition {
  kind: WidgetKind;
  label: string;
  defaultSize: { width: number; height: number };
  constraints: SizeConstraints;
  supports(source: SourceDefinition): boolean;
}

export type SaveDashboardResult =
  | { status: "saved"; dashboard: DashboardDefinition }
  | { status: "conflict"; currentRevision: string }
  | { status: "failed"; message: string };

export interface DashboardRepository {
  load(id: string): Promise<DashboardDefinition>;
  save(
    dashboard: DashboardDefinition,
    expectedRevision: string
  ): Promise<SaveDashboardResult>;
}

