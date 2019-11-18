const Generator = require('yeoman-generator');
const shell = require('shelljs');
const yosay = require('yosay');
const chalk = require('chalk');
const spinner = require('ora');
const helper = require('../app/js/common.js');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument("devhubName", { type: String, required: false });
    this.argument("orgName", { type: String, required: false });
    this.argument("nonScratchOrgs", { type: Array, required: false });
    this.argument("scratchOrgs", { type: Array, required: false });
    this.argument("skipIntro", { type: Boolean, required: false });

    this.defaultDevHub = {alias:this.options.devhubName};
    this.defaultOrg =  {alias:this.options.orgName};

    this.nonScratchOrgs = this.options.nonScratchOrgs;
    this.scratchOrgs = this.options.scratchOrgs;
  }

  initializing() {
     // Start loading spinner
     this.loading = new spinner(
      { spinner:'dots',
        color : 'yellow' }
    );
    if(!this.options.skipIntro) {
      const output = helper.getOrgDefaults();

      this.defaultDevHub = output.defaultDevHub;
      this.defaultOrg = output.defaultOrg;
      this.nonScratchOrgs = output.nonScratchOrgs;
      this.scratchOrgs = output.scratchOrgs;

      this.log( yosay( output.yosay )); 
     
    }

  }
  
  prompting() {
      // setting a cancel option to go back
    const CANCEL_OPTION =  {
        name : chalk.inverse('Cancel'),
        value : 'cancel'
    };

    // dynamic options from org list for Devhub alias names
    let devhubOptions = helper.getOrgOptions(this.nonScratchOrgs);
    // dynamic options from scratch org list for Scratch alias names
    let scratchOptions = helper.getOrgOptions(this.scratchOrgs);   
    
    let allOrgAliases = helper.getOrgOptions([...this.nonScratchOrgs, ...this.scratchOrgs]);


          devhubOptions.push(CANCEL_OPTION);
          scratchOptions.push(CANCEL_OPTION);
          allOrgAliases.push(CANCEL_OPTION);

    this.log('--------------------------------');
    const questions = [
      {
        type: 'list',
        name: 'orgCommand',
        message: 'Select Option :',
        choices:[
          {
            name:  'Open Org',
            value:  'open'
          },
          {
            name:  'Delete Scratch Org',
            value:  'delete'
          },
          {
            name:  'Connect Org',
            value:  'connect'
          },
          {
            name:  'Configure Defaults',
            value:  'settings'
          }
        ]
      },
      {
        type: 'list',
        name: 'configureOption',
        message: 'Change Defaults for :',
        when: function(answers) {
          return answers.orgCommand == 'settings' ? true : false;
        },
        choices:['DevHub','Scratch Org']
      },
      {
        type: 'rawlist',
        name: 'otherDevhub',
        message: 'Select other DevHub :',  
        default: this.defaultDevHub.alias,
        when: function(answers) {
          return answers.configureOption == "DevHub";
        },
        choices: devhubOptions
      },
      {
        type: 'list',
        name: 'scratchAliasName',
        message: 'Select Existing Scratch org :',  
        default: this.defaultOrg.alias,
        when: function(answers) {
          return answers.orgCommand == "delete" || answers.configureOption == "Scratch Org";
        },
        choices: scratchOptions
      },
      {
        type: 'list',
        name: 'orgAliasName',
        message: 'Select Org :',  
        default: this.defaultOrg.alias,
        when: function(answers) {
          return answers.orgCommand=="open";
        },
        choices: allOrgAliases
      }
    ];

    return this.prompt(questions).then(answers => {
          this.props = answers;
    });
  }
    
  configuring() {
 
    let sfdxCommand =' sfdx';
    let runCommand = false;
    let successMSG,failMSG ='';
    // what to do with the org ?
    switch (this.props.orgCommand) {
          case 'connect':
            this.composeWith(require.resolve('../connect'));
          break;
      case 'open':
          if(this.props.orgAliasName != 'cancel'){
            sfdxCommand +=' force:org:open';
            sfdxCommand += ' -u ' + this.props.orgAliasName;
            runCommand = true;
            successMSG = 'Will open org ' + this.props.orgAliasName;
            failMSG='Failed to open org';
          }
          break;
      case 'delete':
          if(this.props.scratchAliasName != 'cancel'){
              sfdxCommand +=' force:org:delete';
              sfdxCommand += ' -u ' + this.props.scratchAliasName;
            if(this.options.devhubName)
              sfdxCommand += ' -v ' + this.options.devhubName;
              sfdxCommand +=' -p'; // No prompt to confirm deletion.
              runCommand = true;
              successMSG = 'Deleted org ' + this.props.scratchAliasName + ' successfully !'
              failMSG='Failed to delete org';
          }
          break;

      case 'settings':
          successMSG = chalk.green(`set default ${ chalk.greenBright(this.props.configureOption) } configuration successfully! \n`);
          failMSG= chalk.redBright('Failed to configure default org');
          // which option to configure
            switch (this.props.configureOption) {
              case 'DevHub':
                if(this.props.otherDevhub != 'cancel') {
                  sfdxCommand +=' force:config:set defaultdevhubusername=' + this.props.otherDevhub + ' -g';
                  runCommand = true;
                }
                  break;
              case 'Scratch Org':  
              if( this.props.scratchAliasName != 'cancel'){
                sfdxCommand +=' force:config:set defaultusername=' + this.props.scratchAliasName + ' -g';
                runCommand = true;
              }
                break;
              default:
                  runCommand = false;
                  this.composeWith(require.resolve('../app'),{  devhubName : this.props.otherDevhub,
                                                                orgName : this.props.scratchAliasName 
                                                                });
            }
          
          break;
      default:
        this.log('option not supported');
        //shell.exit(1);
    }
      // check if need to run command
      if(runCommand){
        this.loading.start('Run : ' + chalk.yellow(sfdxCommand)+'\n');
        if( shell.exec(sfdxCommand).code === 0 ){

          this.loading.succeed(successMSG); 
          this.composeWith(require.resolve('../app'),{  devhubName : this.props.otherDevhub,
                                                        orgName : this.props.scratchAliasName 
                                                      });
        }
        else {
          this.loading.fail(failMSG);
        }
      }

      // abort option
      if(this.props.otherScratch == 'cancel' || this.props.otherDevhub == 'cancel' || this.props.orgAliasName == 'cancel') {
        this.composeWith(require.resolve('../app'),{   devhubName : this.options.devhubName,
                                                          orgName : this.options.orgName 
                                                    });
      }
  }

  writing() {
    
  }

  end() {
    
  }

};
