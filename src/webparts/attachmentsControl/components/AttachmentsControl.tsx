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

  constructor(props: IAttachmentsControlProps, state: IAttachmentsControlState) {
    super(props);
    sp.setup({ spfxContext: this.props.context });
    this.state = ({ files: [], param: JSON.parse((new URLSearchParams(document.location.search)).get('meta')) ?? {}, spinnerIsHidden: true, textLabel: this.props.input_text });

    registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginFileValidateSize);
  }

  public render(): React.ReactElement<IAttachmentsControlProps> {

    console.log("v294");
    console.log(this.props.useLog);

    //?meta={"folder": "fotos de mi tia","data": [{"column": "RefID","value":"10"}]}
    //  const searchParams = new URLSearchParams(document.location.search);
    //  const metaParam = JSON.parse( searchParams.get('meta') ) ?? {};

    console.log(this.state.param);
    console.log(typeof this.state.param);
    console.log(Object.keys(this.state.param).length > 0 ? this.state.param['data'][0]['column'] : 'empty column');
    console.log(Object.keys(this.state.param).length > 0 ? this.state.param['data'][0]['value'] : 'empty value');

    //  console.log(searchParams.get('meta'));
    //  console.log(searchParams.entries());


    const attachs = (e) => this.props.max_file_size <= (e.size / 1e+6);
    let buttonIsHidden = this.state.files.some(attachs) || this.state.files.length < 1;

    return (
      <div className={styles.attachmentsControl}>
        <div className={styles['loading-spinner-place']} hidden={this.state.spinnerIsHidden}></div>
        <div hidden={this.state.spinnerIsHidden}>
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
          labelIdle={this.state.textLabel}
          onupdatefiles={fileItems => {
            this.setState({
              files: fileItems.map(fileItem => fileItem.file)
            });
          }}
        />
        <div hidden={buttonIsHidden}>
          <div className={styles['button-place']} >
            <PrimaryButton className={styles['primary-button']} text={this.props.button_text} onClick={this._uploadFiles} />
          </div>
        </div>
        <br />
      </div>
    );
  }

  @autobind
  private async _uploadFiles() {

    //Show loading spinner
    this.setState({ spinnerIsHidden: false });

    //Will be executed in case the upload was successful
    const success = () => {

      this.setState({ spinnerIsHidden: true, textLabel: this.props.input_text_success });
      setTimeout(() => {
        this.setState({ textLabel: this.props.input_text });
      }, 3000);

    }

    //Send log file in case an error has ocurred
    const sendLog = async (code: string, description: string) => {

      await sp.web.lists.getByTitle('log_s').items.add({
        type: 'SDGE_AttachmentsControl',
        code,
        description
      });

    }

    const handleError = async (error: any) => {

      this.setState({ spinnerIsHidden: true });

      if (typeof error.response !== 'undefined' && typeof error.response.data !== 'undefined' && error.response.data !== null) {

        throw new Error(error.response.data);
      } else {

        let entireError = String(error);
        let errorMessage = JSON.parse(error.message.split('::>')[1])["odata.error"].message.value;

        alert(errorMessage);
        sendLog(entireError, errorMessage);

        throw error;
      }
    }

    //Cambiar este JSON que se lea desde un param y aplicarlo al resto del código, que pasa si viene vacio?
    const dataStr =
      Object.keys(this.state.param).length > 0 ?
        JSON.stringify(
          {
            folder: this.state.param['folder'],
            data: [{
              column: this.state.param['data'][0]['column'] ?? '',
              value: this.state.param['data'][0]['value'] ?? ''
            }]
          }
        ) : '';


    const dataJSON = JSON.parse(dataStr);
    const filesLength = this.state.files.length;
    let listName;
    console.log("1");
    const list = await sp.web.lists.getById(this.props.library.toString()).expand('RootFolder').select('Title,RootFolder/ServerRelativeUrl').get().then(function (result) {
      listName = result.Title
    });
    console.log("2");

    const path = dataJSON.folder == '' ? `/sites/Desarrollo/${listName}/` : `/sites/Desarrollo/${listName}/${dataJSON.folder}`;
    const chunkFileSize = 10485760;

    this.state.files.forEach(async (file, i) => {
      // you can adjust this number to control what size files are uploaded in chunks
      console.log("3");
      //  try {
      if (file.size <= chunkFileSize) {
        try {
          console.log("4");
          // small upload  

          sendLog("code test", "description test");

          const newfile = await sp.web.getFolderByServerRelativeUrl(path).files.add(file.name, file, true);
          console.log(newfile);

          console.log("5");

          const item = await newfile.file.getItem();

          console.log("6");

          await item.update({
            [dataJSON.data[0].column]: dataJSON.data[0].value
          });
          console.log("7");
          success();
          console.log("8");
          //         
        }
        catch (error) {
          console.log("inside error 9");
          handleError(error);
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
          success();
        }
        catch (e) {
          handleError(e);
        }
      }
      /*    }
          catch (error) {
            console.error('Failed to GET: ' + error)
            if (typeof error.response !== 'undefined' && typeof error.response.data !== 'undefined' && error.response.data !== null) {
              throw new Error(error.response.data)
            } else {
              throw error
            }
          }*/
    });

    this.setState({ files: [] });
  }

}
