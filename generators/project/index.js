'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const shell = require('shelljs');
const spinner = require('ora');
const helper = require('../app/js/common.js');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument("projectName", { type: String, required: false });
    this.argument("skipIntro", { type: Boolean, required: false });
  }
  initializing() {
    this.loading = new spinner(
      { spinner:'monkey',
        color : 'yellow' }
    );
  }
prompting() {
    this.log('--------------------------------');
    const projectQuestions = [
      {
        type: "input",
        name: "projectName",
        message: "Project Name ? "+ chalk.yellow(this.destinationPath() +"/ "),
        default:'MyProject',
        when: !this.options.projectName,
        validate: function(value) {
          return value ? true : 'Please enter a name';
        }
      },
      {
        type: "input",
        name: "appFolder",
        message: "App Folder Name ? ",
        default: 'force-app',
        validate: function(value) {
          return value ? true : 'Please enter a name';
        }
      },
      {
        type: "input",
        name: "appNamespace",
        message: "Namespace (optional)"
      },
      {
        type    : 'confirm',
        name    : 'includeReadMe', 
        message : 'Include ReadMe file',
        default : true
      },
      {
        type: "editor",
        name: "appDescription",
        message: "Description (optional)",
        when: function(answers) {
          return answers.includeReadMe;
        }
      }
    ];
   
    const questions = [...projectQuestions];
    // will store user inputs 
    this.props = {};

    // ask the questions and use the answers
    return this.prompt(questions).then(answers => {
        this.props = answers;
        this.props.projectName = this.options.projectName ? this.options.projectName : answers.projectName;
    });
}


configuring() {

}

writing() {

      this.loading.start('configuring sfdx project options for : ' + chalk.red(this.props.projectName) + '\n');

      let sfdxCommand = ' sfdx force:project:create';
          sfdxCommand += ' -n ' + this.props.projectName;

          if(this.props.appFolder)
            sfdxCommand += ' -p ' + this.props.appFolder; // --defaultpackagedir DEFAULTPACKAGEDIR Default value: force-app
          if(this.props.appNamespace)
          sfdxCommand += ' -s ' + this.props.appNamespace;  //  --namespace NAMESPACE Type: string

          sfdxCommand += ' -t ' + 'standard';   // --template 
        //  if(this.props.includeManifest)
          sfdxCommand += ' -x '; //--manifest Type: boolean

          this.log(" Run 🏄🏻‍ : "+ chalk.magenta(sfdxCommand) );
          
          if( shell.exec(sfdxCommand).code === 0 ) {
                // Removing current files from project if they exists
                if(shell.test('-e', this.props.projectName  + '/readme.md')) 
                shell.rm ( this.props.projectName  + '/readme.md' );
                if(shell.test('-e', this.props.projectName  + '/.gitignore')) 
                shell.rm ( this.props.projectName  + '/.gitignore' );
                if(shell.test('-e', this.props.projectName  + '/.forceignore')) 
                shell.rm ( this.props.projectName  + '/.forceignore' );

                if(this.props.includeReadMe){
                  // writing readme file
                  this.fs.copyTpl(
                    this.templatePath('docs/README.md'),
                    this.destinationPath(this.props.projectName + '/readme.md'),
                    { appPath: this.props.appFolder,
                      appName: this.props.projectName,
                      appDescription: this.props.appDescription
                    }
                  );
                  }
                  // writing .forceignore file
                  this.fs.copy(
                    this.templatePath('settings/.forceignore'),
                    this.destinationPath(this.props.projectName + '/.forceignore')
                  );
                    // writing .gitignore file
                  this.fs.copy(
                    this.templatePath('settings/gitignore'),
                    this.destinationPath(this.props.projectName + '/.gitignore')
                  );

                this.loading.succeed(chalk.green('Created project successfully'));
          }
          else {
                this.loading.fail('Failed to create a project');
          }
          
  
}

install() {
  if(shell.test('-d',this.props.projectName)) {
    this.log( chalk.greenBright("Your project is ready! - Launch VS Code") );
    helper.openCode(this.props.projectName);
    // say completed 
    helper.sayText('Your project was created!');
  }
}

end() {
  


}

};
