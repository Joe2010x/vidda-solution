import jdTemplatesData from './jdTemplates.json';

export interface JDTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface JDTemplatesData {
  templates: JDTemplate[];
}

export const jdTemplates: JDTemplatesData = jdTemplatesData as JDTemplatesData;