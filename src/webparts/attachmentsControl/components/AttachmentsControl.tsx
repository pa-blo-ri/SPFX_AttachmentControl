import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from './AttachmentsControl.module.scss';
import "./spinner.css";

import { IAttachmentsControlProps } from './IAttachmentsControlProps';
import { IAttachmentsControlState } from './IAttachmentsControlState';

import { PrimaryButton } from 'office-ui-fabric-react';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';

import LoadingSpinner from './Spinner'

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

//const [isLoading, setIsLoading] = useState(false);

/*
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

*/


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

    console.log("v131");
    /*
        const useStyles = makeStyles((theme: Theme) =>
          createStyles({
            backdrop: {
              zIndex: theme.zIndex.drawer + 1,
              color: '#fff',
            },
          }),
        );
    
        const classes = useStyles();*/
    let buttonDisabled = true;
    const attachs = (e) => this.props.max_file_size <= (e.size / 1e+6);
    buttonDisabled = this.state.files.some(attachs) || this.state.files.length < 1;

    return (
      <div className={styles.attachmentsControl}>

        <svg className={styles['loading-spinner']} width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
              <stop stop-color="#da2528" stop-opacity="0" offset="0%" />
              <stop stop-color="#da2528" stop-opacity=".631" offset="63.146%" />
              <stop stop-color="#da2528" offset="100%" />
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
              <circle fill="#da2528" cx="36" cy="18" r="1">
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

  /*

        <Backdrop className={classes.backdrop} open>
          <CircularProgress color="inherit" />
        </Backdrop>

*/

  //<img src="${require<string>('../../assets/loading.png')}" alt="loading-spinner" />
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

    let listName;
    const list = await sp.web.lists.getById(this.props.library.toString()).expand('RootFolder').select('Title,RootFolder/ServerRelativeUrl').get().then(function (result) {
      listName = result.Title
    });

    const path = dataJSON.folder == '' ? `/sites/Desarrollo/${listName}/` : `/sites/Desarrollo/${listName}/${dataJSON.folder}`;
    const chunkFileSize = 10485760;

    this.state.files.forEach(async function (file, i) {
      // you can adjust this number to control what size files are uploaded in chunks

      try {
        if (file.size <= chunkFileSize) {
          try {
            // small upload
            //     setIsLoading(true);
            const newfile = await sp.web.getFolderByServerRelativeUrl(path).files.add(file.name, file, true);
            const item = await newfile.file.getItem();
            await item.update({
              [dataJSON.data[0].column]: dataJSON.data[0].value
            });
          }
          catch (e) {
            alert("An error has ocurred. Error status: " + e.status + " Description: " + e.statusText);
          }
        } else {
          try {
            //LOADING GIF CHAT GPT

            // large upload
            //    setIsLoading(true);
            const newfile = await sp.web.getFolderByServerRelativeUrl(path).files.addChunked(file.name, file, data => {
              console.log({ data });
            }, true);
            const item = await newfile.file.getItem();
            await item.update({
              [dataJSON.data[0].column]: dataJSON.data[0].value
            });

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
  }
}
