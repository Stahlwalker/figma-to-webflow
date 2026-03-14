export interface BuildPlanNode {
  tag: string;
  preset: string;
  styleName: string;
  styles: Record<string, string>;
  textContent?: string;
  children: BuildPlanNode[];
  figmaNodeId: string;
  figmaNodeName: string;
}

export interface BuildResult {
  success: boolean;
  elementsCreated: number;
  errors: string[];
}

export type BuildProgress = {
  status: "idle" | "building" | "done" | "error";
  current: string;
  total: number;
  completed: number;
  errors: string[];
};
