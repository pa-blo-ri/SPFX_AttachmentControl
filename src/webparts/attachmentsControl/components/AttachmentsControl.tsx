import * as React from 'react';
import styles from './AttachmentsControl.module.scss';
import { IAttachmentsControlProps } from './IAttachmentsControlProps';
import { IAttachmentsControlState } from './IAttachmentsControlState';
import { IList, PrimaryButton } from 'office-ui-fabric-react';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { sp } from "@pnp/sp/presets/all";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists/web";
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import 'filepond/dist/filepond.min.css';

export default class AttachmentsControl extends React.Component<IAttachmentsControlProps, IAttachmentsControlState> {
  constructor(props: IAttachmentsControlProps, state: IAttachmentsControlState) {
    super(props);
    sp.setup({ spfxContext: this.props.context });    
    this.state = ({
      files: [],
      param: JSON.parse((new URLSearchParams(document.location.search)).get('meta')) ?? {},
      spinnerIsHidden: true,
      textLabel: this.props.input_text,
      filenameError: false
    });

    registerPlugin(FilePondPluginFileValidateSize);
  }

  public render(): React.ReactElement<IAttachmentsControlProps> {
    //Param sintax sample
    //?meta={"folder": "fotos de mi tia", "filename": "*TL200-Z2000*", "data": [{"column": "RefID","value":"10"}]}

    const attachs = (e) => this.props.max_file_size <= (e.size / 1e+6);
    let buttonIsHidden = this.state.files.some(attachs) || this.state.files.length < 1 || this.state.filenameError;

    setTimeout(function() {
      window.parent.postMessage(`COMPONENT_LOADED`, '*');
    }, 500);

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
          files = { this.state.files }
          allowMultiple = { true }
          maxFileSize = { this.props.max_file_size * 1e+6 }
          maxFiles = { this.props.max_files }
          labelIdle = { this.state.textLabel }
          labelFileProcessingComplete = { '' }
          labelFileProcessing = { '' }
          labelFileProcessingAborted = { '' }
          labelTapToCancel = { '' }
          labelTapToRetry = { '' }
          maxParallelUploads = { 5 }
          onremovefile = {
            (error, file) => {
              this.setState({ filenameError: document.querySelectorAll('li[data-filepond-item-state="processing-error"]').length > 0 });
              console.log("file removed", document.querySelectorAll('li[data-filepond-item-state="processing-error"]').length > 0)
              const that = this;
              setTimeout(function() {
                that.setState({ filenameError: document.querySelectorAll('li[data-filepond-item-state="processing-error"]').length > 0 });
                console.log("file removed 2", document.querySelectorAll('li[data-filepond-item-state="processing-error"]').length > 0)
              }, 500);
            }
          }
          server = { 
            {
              process: (fieldName, file, metadata, load, error, progress, abort) => {
                const filenameComparison = this.state.param["filename"];
                const that = this;
                if (filenameComparison !== undefined && filenameComparison !== null && filenameComparison !== "") {
                  var result = this.matchRuleShort(file.name, filenameComparison);                  
                  if (!result) {
                    error(file.name);
                    setTimeout(function() {
                      var errorfiles = document.querySelectorAll('li[data-filepond-item-state="processing-error"] legend');
                      errorfiles.forEach(f => {
                        var error_filename = f.innerHTML;
                        if (error_filename === file.name) {
                          var liNode = f.parentNode.parentNode;
                          if (liNode.querySelector(".filepond--file-status-main")) {
                            liNode.querySelector(".filepond--file-status-main").innerHTML = "Incorrect filename, it should start with " + filenameComparison.replaceAll("*", "")
                            liNode.querySelector(".filepond--action-process-item").remove();
                            liNode.querySelector(".filepond--file-status-sub").remove();
                          }                          
                        }
                      });

                      that.setState({ filenameError: document.querySelectorAll('li[data-filepond-item-state="processing-error"]').length > 0 });
                      console.log(that.state.filenameError, document.querySelectorAll('li[data-filepond-item-state="processing-error"]'));
                    }, 150)                    
                  } else {
                    console.log(file.name, "<<<<<<<<<<<<<<<")
                    abort(file.name)
                    setTimeout(function() {
                      var okfiles = document.querySelectorAll('li[data-filepond-item-state="cancelled"]');
                      okfiles.forEach(f => {
                        if (f.querySelector(".filepond--file-status-main")) {
                          f.querySelector(".filepond--file-status-main").remove()
                          f.querySelector(".filepond--action-retry-item-processing").remove();
                          f.querySelector(".filepond--file-status-sub").remove();
                        }                        
                      });

                      that.setState({ filenameError: document.querySelectorAll('li[data-filepond-item-state="processing-error"]').length > 0 });
                    }, 150);
                  }                                    
                } else {
                  abort(file.name);
                  setTimeout(function() {
                    var cancelledItems = document.querySelectorAll('li[data-filepond-item-state="cancelled"]');
                    cancelledItems.forEach(f => {
                      if (f.querySelector(".filepond--file-status-main")) {
                        f.querySelector(".filepond--file-status-main").remove()
                        f.querySelector(".filepond--action-retry-item-processing").remove();
                        f.querySelector(".filepond--file-status-sub").remove();
                      }                        
                    });

                    that.setState({ filenameError: document.querySelectorAll('li[data-filepond-item-state="processing-error"]').length > 0 });
                  }, 150);
                }            
              }
            }
          }
          onupdatefiles={ fileItems => {
            window.parent.postMessage(`FILES_UPDATE||${ fileItems.length }`, '*');
            this.setState({ files: fileItems.map(fileItem => fileItem.file) });
            this.setState({ filenameError: document.querySelectorAll('li[data-filepond-item-state="processing-error"]').length > 0 });
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

  private matchRuleShort(str, rule) {
    var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
  }

  @autobind
  private async _uploadFiles() {
    this.setState({ spinnerIsHidden: false });

    // Will be executed in case the upload was successful
    const success = () => {
      console.log("success called");
      window.parent.postMessage(`FILES_UPDATE||0`, '*');
      this.setState({ spinnerIsHidden: true, textLabel: this.props.input_text_success });
      setTimeout(() => { 
        this.setState({ textLabel: this.props.input_text }); 
        window.parent.postMessage(`FILES_UPDATE||0`, '*');
      }, 3000);
    }

    // Send log file in case an error has ocurred
    const sendLog = async (code: string, description: string) => {
      try {
        if (this.props.useLog && this.props.logs_folder != '') {
          let logList: string;
          await sp.web.lists.getById(this.props.logs_folder.toString()).expand('RootFolder').select('Title,RootFolder/ServerRelativeUrl').get().then(function (result) {
            logList = result.Title
          });

          await sp.web.lists.getByTitle(logList).items.add({
            type: 'SDGE_AttachmentsControl',
            metaParam: Object.keys(this.state.param).length > 0 ? JSON.stringify(this.state.param) : 'Empty',
            code,
            description
          });
        }
      } catch (error) {
        if (typeof error.response !== 'undefined' && typeof error.response.data !== 'undefined' && error.response.data !== null) {
          throw new Error(error.response.data);
        } else {
          let errorMessage = JSON.parse(error.message.split('::>')[1])["odata.error"].message.value;
          console.log(errorMessage);
          throw error;
        }
      }
    }

    // Error handling
    const handleError = async (error: any) => {
      this.setState({ spinnerIsHidden: true });
      console.log(error);
      if (typeof error.response !== 'undefined' && typeof error.response.data !== 'undefined' && error.response.data !== null) {        
        throw new Error(error.response.data);
      } else {
        let entireError = String(error);
        let errorMessage = JSON.parse(error.message.split('::>')[1])["odata.error"].message.value;
        console.log(errorMessage);
        sendLog(entireError, errorMessage);
        throw error;
      }
    }

    console.log("1")
    // Creating string from param object 
    const dataStr = Object.keys(this.state.param).length > 0 ?
      JSON.stringify(
        {
          folder: this.state.param['folder'],
          data: this.state.param['data']
        }
      ) : 
    '';

    console.log("2", dataStr)
    
    let listId: string = this.props.library.toString();
    let list = sp.web.lists.getById(listId);
    let listName: string = (await list.select("Title")()).Title;    
    const dataJSON = dataStr === '' ? {} : JSON.parse(dataStr);
    const siteUrl = '';
    const path = dataJSON.folder === undefined || dataJSON.folder === '' ? `${siteUrl}${listName}/` : `${siteUrl}${listName}/${dataJSON.folder}`;
    const chunkFileSize = 10485760;
    let filesUploaded = 0;
    const totalFiles = this.state.files.length;    
    this.state.files.forEach(async (file, i) => {      
      if (file.size <= chunkFileSize) {
        try {
          // Small upload
          let filename = file.name;
          let formId = "";
          if (dataJSON.data !== undefined) {
            formId = dataJSON.data[0].value;           
            filename = `${formId}-${file.name}`;
          }
          const newfile = await sp.web.getFolderByServerRelativeUrl(path).files.add(filename, file, true);

          if (dataJSON.data !== undefined) {
            const formIdColumn = dataJSON.data[0].column;
            const item = await newfile.file.getItem();
            
            let updates = { FileName: file.name  };
            dataJSON.data.forEach(e => { updates[e.column] = e.value });
            console.log("updates>>>> ", updates);
            await item.update(updates);
          }
          filesUploaded += 1;
          if (filesUploaded >= totalFiles) {
            success();
          }          
        }
        catch (error) {
          handleError(error);
        }
      } else {
        try {
          // Large upload
          let filename = file.name;
          let formId = "";
          if (dataJSON.data !== undefined) {
            formId = dataJSON.data[0].value;           
            filename = `${formId}-${file.name}`;          
          }          
                   
          const newfile = await sp.web.getFolderByServerRelativeUrl(path).files.addChunked(filename, file, data => {
          }, true);

          if (dataJSON.data !== undefined) {
            const formIdColumn = dataJSON.data[0].column;  // [formIdColumn]: formId,
            const item = await newfile.file.getItem();
            let updates = { FileName: file.name  };
            dataJSON.data.forEach(e => { updates[e.column] = e.value });
            console.log("updates>>>> ", updates);
            await item.update(updates);
          }

          filesUploaded += 1;
          console.log("filesUploaded", filesUploaded, totalFiles)
          if (filesUploaded >= totalFiles) {
            success();
          } 
        }
        catch (error) {
          handleError(error);
        }
      }
    });
    
    this.setState({ files: [] });
  }
}
