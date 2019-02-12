/* eslint-disable require-jsdoc */
const TM = require('../templatemanager');
const vscode = require('vscode');
const fs = require('fs');

const FILE_EXISTS = 'Template with same name already exists.';
function createTemplate(templateText = '') {
  const input = vscode.window.showInputBox({
    prompt: 'Enter template name with extension. (Ex: javascript.js)',
  });

  input.then((templateName) => {
    if (!templateName) {
      vscode.window.showErrorMessage('Please retry with a valid name');
      return;
    }

    TM.getTemplates().then((templatesInfo) => {
      const templates = Object.keys(templatesInfo);
      if (templates.indexOf(
          templateName.substring(0, templateName.lastIndexOf('.'))) >= 0) {
        vscode.window.showErrorMessage(FILE_EXISTS);
        return;
      }

      fs.writeFile(TM.getTemplatePath(templateName), templateText, (err) => {
        if (!err) {
          vscode.window.showInformationMessage(`${templateName} created.`);
          vscode.commands.executeCommand(
              'vscode.open',
              TM.getTemplateURI(
                  TM.getTemplatePath(templateName)))
              .then(() => {
                console.log('Document opened');
              });
        } else {
          vscode.window.showErrorMessage(err);
        }
      });
    });
  });
}

class NewTemplate {
  newTemplateFromFile() {
    const editor = vscode.window.activeTextEditor;
    const templateText = editor.document.getText();
    createTemplate(templateText);
  }

  newTemplate() {
    createTemplate();
  }
}

module.exports = new NewTemplate();
