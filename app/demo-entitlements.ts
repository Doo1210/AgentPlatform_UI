export type FeatureId = "runtime" | "insights" | "sdk" | "lowcode";
export type DemoStatus = "active" | "available";
export const featureWorkspaceLabels: Record<FeatureId, string> = {
  runtime: "智能体运行时", insights: "智能应用洞察", sdk: "软件开发套件", lowcode: "低代码 UI 开发",
};
export const defaultFeatureStatuses: Record<FeatureId, DemoStatus> = { runtime: "active", insights: "available", sdk: "available", lowcode: "available" };
export const defaultPlatformStatuses = { ontology: "active", vision: "available", timeseries: "available", design: "available" } as const;
