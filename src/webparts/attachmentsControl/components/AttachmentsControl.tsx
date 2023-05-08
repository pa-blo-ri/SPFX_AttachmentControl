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
    
    let buttonDisabled = true;
    const attachs = (e) => this.props.max_file_size <= (e.size / 1e+6)
    console.log("v102");
    console.log("property size 1: " + this.props.max_file_size);    

    console.log("any elements matching? :"+this.state.files.some(attachs));
    console.log(this.state.files.length)
    buttonDisabled = this.state.files.some(attachs) || this.state.files.length < 1

    /*
    this.state.files.forEach(element => { */
    /*  console.log("element size: " + element.size / 1e+6);
      console.log("property size: " + this.props.max_file_size);
      console.log("element null: " + element == null);
      console.log("element undefined: " + element == undefined);*/
    /*  console.log(element.every(this.props.max_file_size <= (element.size / 1e+6)))
      
     if ( element.every(this.props.max_file_size <= (element.size / 1e+6))){
      buttonDisabled = true;
     }
    });*/
    
    return (
      <div className={styles.attachmentsControl}>
        <FilePond
          files={this.state.files}
          allowMultiple={true}
          maxFileSize={this.props.max_file_size * 1e+6}
          maxFiles={this.props.max_files}
          labelIdle={this.props.input_text}
          onupdatefiles={fileItems => {
            this.setState({
              files: fileItems.map(fileItem => fileItem.file)
            });
          }}
        />
        <br />
        <PrimaryButton text={this.props.button_text} onClick={this._uploadFiles} disabled={buttonDisabled}/>
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
