export interface ProjectData {
  version: string;
  metadata: {
    name?: string;
    createdAt: string;
    updatedAt: string;
    generator: "mathedit-web";
    generatorVersion: string;
  };
  globalPreamble?: string;
  document: string;  // Raw LaTeX document with --- separators
}
