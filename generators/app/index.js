'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const shell = require('shelljs');
const spinner = require('ora');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    // input parameter to skip user greeting
    this.argument("devhubName", { type: String, required: false });
    this.argument("orgName", { type: String, required: false });
    
    this.defaultDevHub = {alias:this.options.devhubName};
    this.defaultOrg =  {alias:this.options.orgName};

    this.contextFolders,
    this.nonScratchOrgs,
    this.scratchOrgs  = [];

  }

  initializing() {

      // Start loading spinner
      this.loading = new spinner(
        { spinner:'dots',
          color : 'yellow' }
      ).start('Pulling DX defaults...');

      // reading all folders inside this root
      let projectsPath = this.destinationPath();
      let pathFolders = shell.ls('-L',projectsPath);
      let paths = [];
    
      pathFolders.forEach(function(folder) {
        let relativePath = folder.substring(projectsPath.length,folder.length );
          if( folder.indexOf( 'sfdx_logs' ) === -1 ){
            let pathOption = {
              name : relativePath,
              value : folder
            }
            paths.push(pathOption);
          }
      });
      const CANCEL_OPTION =  {
        name : chalk.inverse('Cancel'),
        value : 'cancel'
      };
      paths.push(CANCEL_OPTION);
      this.contextFolders = paths; 

       // Silently get the available orgs as JSON
      let orgsOutput = JSON.parse( shell.exec(' sfdx force:org:list --json', { silent: true } ).stdout );
      // Collect all non Scratch orgs
      this.nonScratchOrgs = orgsOutput.result.nonScratchOrgs;
      // Grab Default DevHub
      if(!this.defaultDevHub.alias){
        if(this.nonScratchOrgs.length > 0) {
          this.defaultDevHub = this.nonScratchOrgs.find(org => org.isDevHub);
          if(!this.defaultDevHub)
          this.defaultDevHub =  {alias:'NONE'};
        }
        else {
          this.defaultDevHub =  {alias:'NONE'};
        }
      }
      // Collect Scratch Orgs
      this.scratchOrgs  = orgsOutput.result.scratchOrgs;
      // Grab Default Scratch Org
      if(!this.defaultOrg.alias){
        if(this.scratchOrgs.length > 0) {
          this.defaultOrg = this.scratchOrgs.find(org => org.isDefaultUsername);
          if(!this.defaultOrg) {
            this.defaultOrg =  {alias:'NONE'};
          }
        }
        else {
          this.defaultOrg =  {alias:'NONE'};
        }
      }
      // Show Yeoman Message and Stop Spinner   
      if(this.defaultDevHub.alias !== 'NONE') {
        // Stops Spinner and show success
        this.loading.succeed('Pulled defaults successfully');
          // Tell yo to say all details we collected
        this.log( yosay( chalk.redBright.underline('Welcome to DX \n') + 
                  `Connected Orgs : ${chalk.cyan(this.nonScratchOrgs.length)} \n` +
                  `Active Scratch Orgs : ${chalk.cyan(this.scratchOrgs.length)} \n\n` + 
                  `Default DevHub : ${chalk.cyan( this.defaultDevHub.alias )} \n` +
                  `Default Scratch : ${chalk.cyan( this.defaultOrg.alias )} `
        ) ); 
      }
      else {
        // Stops Spinner and show failure
        this.loading.fail('Failed to pull defaults');
        // Tell yo to say you need to connect
        this.log( yosay( chalk.redBright('NEED TO CONNECT DEVHUB') )); 
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
            checked: false
          },
          {
            name:  'New Scratch Org',
            value:  'create-org',
            checked: false
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
            projectName : this.props.projectName
        });
    }

    if( this.selectedOptions.includes("open-project")&& this.props.existingProject != 'cancel'){
      shell.exec(' code ' + this.props.existingProject) ;
    }

    if( this.selectedOptions.includes("create-org") ){
      this.composeWith(require.resolve('../org'),{
        devhubName : this.defaultDevHub.alias,
        projectPath : this.props.projectName
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
      // cleanup
      if ( shell.test('-e', this.destinationPath()+'/sfdx_logs' ) )  { 
        this.log(chalk.red('-- cleanup ') + this.destinationPath()+'/sfdx_logs');
        shell.rm('-rf',this.destinationPath()+'/sfdx_logs');
      }
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
