import * as React from 'react';
import styles from './AttachmentsControl.module.scss';
import { IAttachmentsControlProps } from './IAttachmentsControlProps';
import { IAttachmentsControlState } from './IAttachmentsControlState';

import { PrimaryButton } from 'office-ui-fabric-react';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';

import { sp } from "@pnp/sp/presets/all";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists/web";

import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import 'filepond/dist/filepond.min.css';


export default class AttachmentsControl extends React.Component<IAttachmentsControlProps, IAttachmentsControlState> {
  lib;
  constructor(props: IAttachmentsControlProps, state: IAttachmentsControlState) {
    super(props);
    sp.setup({ spfxContext: this.props.context });
    this.state = ({ files: [] });
//    this.lib = this.props.library;
    registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginFileValidateSize);
  }

  public render(): React.ReactElement<IAttachmentsControlProps> {

    console.log("v88");
    console.log(this.props.max_file_size);    
    this.state.files.forEach(element => {
      console.log(element.size / 1e+6);
      console.log(this.props.max_file_size);
      console.log(this.props.max_file_size <= (element.size / 1e+6))
    });
    
    return (
      <div className={styles.attachmentsControl}>
        <FilePond
          files={this.state.files}
          allowMultiple={true}
          maxFileSize={this.props.max_file_size}
          maxFiles={this.props.max_files}
          labelIdle={this.props.input_text}
          onupdatefiles={fileItems => {
            this.setState({
              files: fileItems.map(fileItem => fileItem.file)
            });
          }}
        />
        <br />
        <PrimaryButton text={this.props.button_text} onClick={this._uploadFiles} />
      </div>
    );
  }

  @autobind
  private async _uploadFiles() {

    // try {
   
    let listName;
    const list = await sp.web.lists.getById(this.props.library.toString()).expand('RootFolder').select('Title,RootFolder/ServerRelativeUrl').get().then(function (result) {
      listName = result.Title
    });
    const path = `/sites/Desarrollo/${listName}/`;
    const chunkFileSize = 10485760;

    this.state.files.forEach(async function (file, i) {
      // you can adjust this number to control what size files are uploaded in chunks

      try {
        if (file.size <= chunkFileSize) {
          try {
            console.log("1");

            // small upload
            const newfile = await sp.web.getFolderByServerRelativeUrl(path).files.add(file.name, file, true);
          }
          catch (e) {
            alert("An error has ocurred. Error status: " + e.status + " Description: " + e.statusText);
          }
        } else {
          try {
            console.log("2");

            //LOADING GIF CHAT GPT
            // large upload
            const newfile = await sp.web.getFolderByServerRelativeUrl(path).files.addChunked(file.name, file, data => {
              console.log({ data });
            }, true);
            console.log({ newfile });
            //LOADING GIF OFF
          }
          catch (e) {
            alert("An error has ocurred. Error status: " + e.status + " Description: " + e.statusText);
          }
        }
      }
      catch (e) {
        alert("An error has ocurred. Error status: " + e.status + " Description: " + e.statusText);
      }

    });
    this.setState({ files: [] });
    // }
    //  catch (e) {
    //    alert("An error has ocurred. Error status: " + e.status + " Description: " + e.statusText)
    //  }

  }
}
