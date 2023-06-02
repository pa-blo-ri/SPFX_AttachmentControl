import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IAttachmentsControlProps {
  context: WebPartContext;
  library: string | string[]; // Stores the list ID(s);
  logs_folder: string | string [];
  max_files: number;
  max_file_size: number;
  input_text: string;
  input_text_success: string;
  button_text: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  useLog: boolean;
}
