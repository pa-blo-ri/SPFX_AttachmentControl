import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from './AttachmentsControl.module.scss';

import { IAttachmentsControlProps } from './IAttachmentsControlProps';
import { IAttachmentsControlState } from './IAttachmentsControlState';

import { PrimaryButton, Spinner } from 'office-ui-fabric-react';
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

let isOk = false;

export default class AttachmentsControl extends React.Component<IAttachmentsControlProps, IAttachmentsControlState> {

  lib;
  constructor(props: IAttachmentsControlProps, state: IAttachmentsControlState) {
    super(props);
    sp.setup({ spfxContext: this.props.context });
    this.state = ({ files: [] });

    registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginFileValidateSize);
  }

  public render(): React.ReactElement<IAttachmentsControlProps> {

    console.log("v177");


    const attachs = (e) => this.props.max_file_size <= (e.size / 1e+6);
    let buttonDisabled = this.state.files.some(attachs) || this.state.files.length < 1;

    return (
      <div className={styles.attachmentsControl}>
        <div className={styles['loading-spinner-place']} hidden={this.props.spinnerIsHidden}></div>
        <div hidden={this.props.spinnerIsHidden}>
          <svg className={styles['loading-spinner']} width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
                <stop stop-color="#ab0707" stop-opacity="0" offset="0%" />
                <stop stop-color="#ab0707" stop-opacity=".631" offset="63.146%" />
                <stop stop-color="#ab0707" offset="100%" />
              </linearGradient>
            </defs>
            <g fill="none" fill-rule="evenodd">
              <g transform="translate(1 1)">
                <path d="M36 18c0-9.94-8.06-18-18-18" id="Oval-2" stroke="url(#a)" stroke-width="2">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 18 18"
                    to="360 18 18"
                    dur="0.9s"
                    repeatCount="indefinite" />
                </path>
                <circle fill="#ab0707" cx="36" cy="18" r="1">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 18 18"
                    to="360 18 18"
                    dur="0.9s"
                    repeatCount="indefinite" />
                </circle>
              </g>
            </g>
          </svg>
        </div>
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
        <PrimaryButton text={this.props.button_text} onClick={this._uploadFiles} disabled={buttonDisabled} />
        <br />

      </div>
    );
  }


  @autobind
  private async _uploadFiles() {


    const dataStr = JSON.stringify(
      {
        folder: 'fotos de mi tia',
        data: [{
          column: 'RefID',
          value: '10'
        }]
      }
    );
    const dataJSON = JSON.parse(dataStr);
    const filesLength = this.state.files.length;
    let listName;
    const list = await sp.web.lists.getById(this.props.library.toString()).expand('RootFolder').select('Title,RootFolder/ServerRelativeUrl').get().then(function (result) {
      listName = result.Title
    });

    const that = this;
    console.log(isOk)

    const path = dataJSON.folder == '' ? `/sites/Desarrollo/${listName}/` : `/sites/Desarrollo/${listName}/${dataJSON.folder}`;
    const chunkFileSize = 10485760;

    (this.props.spinnerIsHidden as boolean) = false;

    let test = 0;

    const func = async () => {
      
    
      this.state.files.forEach(async (file, i) => {
        // you can adjust this number to control what size files are uploaded in chunks

        try {
          if (file.size <= chunkFileSize) {
            try {
              // small upload
              //            (this.props.spinnerIsHidden as boolean) = false;

              (this.props.spinnerIsHidden as boolean) = false;
              
              const newfile = await sp.web.getFolderByServerRelativeUrl(path).files.add(file.name, file, true);
              const item = await newfile.file.getItem();
              await item.update({
                [dataJSON.data[0].column]: dataJSON.data[0].value
              });
              test = 1 ;
              console.log("adentro");
              console.log(test);
            }
            catch (e) {
              await sp.web.lists.getByTitle('log_s').items.add({
                type: 'SDGE_AttachmentsControl',
                code: String(e.status),
                description: String(e.statusText)
              });
              alert("An error has ocurred. Error status: " + e.status + " Description: " + e.statusText);
              console.error(e);              
            }
          } else {
            try {

              // large upload
              const newfile = await sp.web.getFolderByServerRelativeUrl(path).files.addChunked(file.name, file, data => {
                console.log({ data });
              }, true);
              const item = await newfile.file.getItem();
              await item.update({
                [dataJSON.data[0].column]: dataJSON.data[0].value
              });
            }
            catch (e) {

              alert("An error has ocurred. Error status: " + e.status + " Description: " + e.statusText);
              console.error(e); 

              await sp.web.lists.getByTitle('log_s').items.add({
                type: 'SDGE_AttachmentsControl',
                code: String(e.status),
                description: String(e.statusText)
              });
              
            }
          }
        }
        catch (e) {
          alert("An error has ocurred. Error status: " + e.status + " Description: " + e.statusText);
        }
        return console.log("return: "+test)
      });
      return test
    }
    (this.props.spinnerIsHidden as boolean) = true;
    console.log("afuera: "+ await func())
    this.setState({ files: [] });
  }
}
