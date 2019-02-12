/* eslint-disable require-jsdoc */
const TM = require('../templatemanager');
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const DATE_TOKEN = '${DATE}';
const AUTHOR_TOKEN = '${AUTHOR}';
const FILE_TOKEN = /\$\{FILE\}/g;
const FILENAME_TOKEN = /\$\{FILENAME\}/g;
const PACKAGE_TOKEN = /\$\{PACKAGE\}/g;

const NEW_FILE = 'Files: New File';
const FILE_EXISTS_MESSAGE = 'File already exists with the same name.';

function createFile(filepath, data = '', extension = '') {
  const input = vscode.window.showInputBox({
    prompt: 'Enter new fileName',
  });

  input.then((filename) => {
    if (!filename) {
      vscode.window.showErrorMessage('Please retry with a valid filename');
      return;
    }
    const filenameWithExt = filename + extension;
    fs.stat(filepath, (err, stats) => {
      let curDir = filepath;
      if (!stats.isDirectory()) {
        curDir = path.dirname(filepath);
      }

      const newFilePath = path.join(curDir, filenameWithExt);
      const config = vscode.workspace.getConfiguration('templates');
      data = data.replace(AUTHOR_TOKEN, config.Author);
      data = data.replace(DATE_TOKEN, new Date().toDateString());
      data = data.replace(FILENAME_TOKEN, filename);
      data = data.replace(FILE_TOKEN, filenameWithExt);
      const isPartOfProject = filepath.includes('src/main');
      if (filenameWithExt.endsWith('java') && isPartOfProject) {
        const tempPkg = filepath.replace(new RegExp('.*' + 'main/java/'), '');
        const packageName = tempPkg.replace(/\//g, '.');
        data = data.replace(PACKAGE_TOKEN, packageName+';');
      } else if (filenameWithExt.endsWith('java') && !isPartOfProject) {
        const tempPkg = filepath
            .replace(/^\//g, '')
            .replace(/[^\/]*$/, '')
            .replace(/\/$/, '');
        const packageName = tempPkg.replace(/\//g, '.');
        data = data.replace(PACKAGE_TOKEN, packageName+';');
      }
      if (filenameWithExt.endsWith('groovy') && isPartOfProject) {
        const tempPkg = filepath.replace(new RegExp('.*' + 'main/groovy/'), '');
        const packageName = tempPkg.replace(/\//g, '.');
        data = data.replace(PACKAGE_TOKEN, packageName);
      } else if (filenameWithExt.endsWith('groovy') && !isPartOfProject) {
        const tempPkg = filepath
            .replace(/^\//g, '')
            .replace(/[^\/]*$/, '')
            .replace(/\/$/, '');
        const packageName = tempPkg.replace(/\//g, '.');
        data = data.replace(PACKAGE_TOKEN, packageName);
      }

      fs.stat(newFilePath, (err, stats) => {
        if (stats && stats.isFile()) {
          vscode.window.showErrorMessage(FILE_EXISTS_MESSAGE);
          return;
        }
        fs.writeFile(newFilePath, data, (err) => {
          if (err) {
            vscode.window.showErrorMessage('Cannot create new file');
            return;
          }
          vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('file://' + newFilePath)).then(() => {
            console.log('Document opened');
          });
        });
      });
    });
  });
}

function constructTemplatesOptions(templatesInfo) {
  const templateMenuOptions = [{
    label: NEW_FILE,
  }];
  Object.keys(templatesInfo).forEach((template) => {
    const templateName = path.basename(templatesInfo[template]);
    const extStart = templateName.lastIndexOf('.');
    templateMenuOptions.push({
      label: template.charAt(0).toUpperCase() + template.slice(1),
      extension: templateName.substring(extStart),
    });
  });
  return templateMenuOptions;
}

function createNewFile(info) {
  let currentPath = info ? info._fsPath : undefined;
  if (!currentPath) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      currentPath = editor.document.fileName;
    }
    if (!currentPath) {
      currentPath = vscode.workspace.rootPath;
    }
    // TODO : create untitled file from template
    if (!currentPath) {
      return;
    }
  }

  TM.getTemplates().then((templatesInfo) => {
    const templateMenuOptions = constructTemplatesOptions(templatesInfo);
    const select = vscode.window.showQuickPick(templateMenuOptions, {
      placeHolder: 'Select a template to create from',
    });

    select.then((option) => {
      if (!option) {
        return;
      }

      if (!option.extension) {
        // if(option.label === CREATE_TEMPLATE)
        //     newTemplate.newTemplate('');
        // else if(option.label === EDIT_TEMPLATE){
        //     editTemplate();
        // }
        if (option.label === NEW_FILE) {
          createFile(currentPath);
        }

        return;
      }

      fs.readFile(templatesInfo[option.label], 'utf8', (err, data) => {
        if (err) {
          vscode.window.showErrorMessage('Cannot find the template');
          return;
        }

        createFile(currentPath, data, option.extension);
      });
    });
  });
}

module.exports = createNewFile;
