import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';

import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'AttachmentsControlWebPartStrings';
import AttachmentsControl from './components/AttachmentsControl';
import { IAttachmentsControlProps } from './components/IAttachmentsControlProps';


export interface IAttachmentsControlWebPartProps {
  description: string;
  library: string | string[]; // Stores the list ID(s)
  column: string; // Stores the single column property (property can be configured)
  max_file_size: number;
  max_files: number;
  input_text: string;
  button_text: string;
  singleListFiltered: string;
}

export default class AttachmentsControlWebPart extends BaseClientSideWebPart<IAttachmentsControlWebPartProps> {


  public render(): void {
    const element: React.ReactElement<IAttachmentsControlProps> = React.createElement(AttachmentsControl,
      {
        context: this.context,
        library: this.properties.library,
        max_files: this.properties.max_files,
        max_file_size: this.properties.max_file_size,
        input_text: this.properties.input_text,
        button_text: this.properties.button_text,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: 'Properties',
              groupFields: [
                PropertyFieldListPicker('library', {
                  label: "Library",
                  selectedList: this.properties.library,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  includeHidden: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context,
                  deferredValidationTime: 0,
                  key: 'listId'                  
                }),
                PropertyPaneTextField('max_file_size', {
                  label: 'Max file size (MB)'
                }),
                PropertyPaneTextField('max_files', {
                  label: 'Max files'
                }),
                PropertyPaneTextField('input_text', {
                  label: 'Input text'
                }),
                PropertyPaneTextField('button_text', {
                  label: 'Button text'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
