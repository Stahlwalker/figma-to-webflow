export interface WebflowBuildPlan {
  tag: string;
  preset: string;
  styleName: string;
  styles: Record<string, string>;
  textContent?: string;
  children: WebflowBuildPlan[];
  figmaNodeId: string;
  figmaNodeName: string;
}

export interface LayoutContext {
  parentLayout: "HORIZONTAL" | "VERTICAL" | "NONE";
}
