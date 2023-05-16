import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IAttachmentsControlProps {
  context: WebPartContext;
  library: string | string[]; // Stores the list ID(s);
  max_files: number;
  max_file_size: number;
  input_text: string;
  button_text: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  spinnerIsHidden: boolean;
}
