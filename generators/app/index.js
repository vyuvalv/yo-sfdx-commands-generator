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
    // input parameter to skip user greeting
    this.argument("devhubName", { type: String, required: false });
    this.argument("orgName", { type: String, required: false });
    this.argument("skipIntro", { type: Boolean, required: false });
    
    this.defaultDevHub = {alias:this.options.devhubName};
    this.defaultOrg =  {alias:this.options.orgName};

    this.contextFolders,
    this.nonScratchOrgs,
    this.scratchOrgs  = [];

  }

  initializing() {

       // reading all folders inside this root
       this.contextFolders = helper.getPathDirectories(this.destinationPath());
       // tell yo to say welcome !
       if(!this.options.skipIntro) {
         const output = helper.getOrgDefaults();
        // using this[name] to pass variables across all methods.
         this.defaultDevHub = output.defaultDevHub;
         this.defaultOrg = output.defaultOrg;
         this.nonScratchOrgs = output.nonScratchOrgs;
         this.scratchOrgs = output.scratchOrgs;
 
         this.log( yosay( output.yosay )); 
       }
  }

  prompting() {

    // Main Menu questions to ask
    const menuQuestions = [
      {
        type: 'checkbox',
        name: 'mainMenu',
        message: 'What would you like to do ?',
        validate: function(choices) {
          return choices.length > 0 ? true : chalk.redBright('Must Select at least one option');
        },
        choices: [
          {
            type: 'separator', 
            line:'-˯-˯-˯-˯-˯-˯-˯'
          },
          {
            name:  'New Project',
            value: 'create-project' ,
            checked: true
          },
          {
            name:  'New Scratch Org',
            value:  'create-org',
            checked: true
          },
          {
            name:  'Manage DX',
            value:  'manage-dx',
            checked: false
          },
          {
            name:  'Open Project Folder',
            value: 'open-project' ,
            checked: false
          },
          {
            type: 'separator', 
            line: '-^-^-^-^-^-^-^'
          },
          {
            name:  chalk.inverse('Exit'),
            value:  'exit',
            checked: false
          },
          {
            type: 'separator', 
            line: '-^-^-^-^-^-^-^'
          }
        ]
      },
    ];


    // assign folder list to local variable
    const currentFolders = this.contextFolders;

    // optional questions
    const optionalQuestions = [
      {
        type: "input",
        name: "projectName",
        message: "Project Name ? "+ chalk.yellow(this.destinationPath() +"/ "),
        default:'MyProject',
        when: function(answers) {
          return answers.mainMenu.includes("create-project");
        },
        validate: function(value) {
          return value ? true : 'Please enter a name';
        }
      },
      {
        type: 'list',
        name: 'existingProject',
        message: 'Select Project :',  
        when: function(answers) {
          return answers.mainMenu.includes("open-project");
        },
        choices: currentFolders
      }
    ];

    const questions = [...menuQuestions, ...optionalQuestions];
    this.props = {};

    // prompting all questions
    return this.prompt(questions).then(answers => {
      // assign answers to props
      this.props =  answers;
      this.selectedOptions = answers.mainMenu;
    
    });
  }

  configuring() {

    // composing sub-generators for each option
    if( this.selectedOptions.includes("create-project")){
        this.composeWith(require.resolve('../project'),{
            projectName : this.props.projectName,
            skipIntro: true
        });
       
    }

    if( this.selectedOptions.includes("open-project")&& this.props.existingProject != 'cancel'){
      shell.exec(' code ' + this.props.existingProject) ;
    }

    if( this.selectedOptions.includes("create-org") ){
      this.composeWith(require.resolve('../org'),{
        devhubName : this.defaultDevHub.alias,
        projectPath : this.props.projectName,
        skipIntro: true
      });
    }

    if( this.selectedOptions.includes("manage-dx") ) {

      this.composeWith(require.resolve('../manage'),{
        devhubName : this.defaultDevHub.alias,
        orgName :  this.defaultOrg.alias,
        nonScratchOrgs: this.nonScratchOrgs,
        scratchOrgs:this.scratchOrgs,
        skipIntro:true
      });
    }
   
    if( this.selectedOptions.includes("exit") ) {
      // exit
      shell.exit(1);
    }

    // abort option
    if(this.props.existingProject == 'cancel') {
        this.composeWith(require.resolve('../app'));
    }
  }

  writing() {
      
  }

  install() {

  }

  end() {
    //shell.exit(1);
  }

};
