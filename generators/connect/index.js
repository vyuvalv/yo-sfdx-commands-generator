const Generator = require('yeoman-generator');
const shell = require('shelljs');
const chalk = require('chalk');
const spinner = require('ora');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument("orgName", { type: String, required: false });
  }

  initializing() {
        // Start loading spinner
      this.loading = new spinner(
        { spinner:'dots',
          color : 'yellow' }
      );
  }
  
  prompting() {
    this.log('--------------------------------');
    const questions = [
      {
        type: "input",
        name: "orgName",
        message: `Org ${chalk.red('alias')} Name`,
        when: !this.options.orgName,
        validate: function(value) {
          return value ? true : 'Please enter a name';
        }
      },
      {
        type: 'list',
        name: 'orgType',
        message: 'Choose Org Type:',  
        default: 'Devhub',
        choices: ['DevHub','Production','Sandbox']
      },
      {
        type: "confirm",
        name: "isDefault",
        message: "Set as default org",
        default: false
      }
    ];

    return this.prompt(questions).then(answers => {
      this.log("=========================");
      // asign org name
      const orgName = answers.orgName ? answers.orgName : this.options.orgName;
      this.loading.start(chalk.yellow("Connecting to " + orgName + "\n"));
      // SFDX Command building
      let sfdxCommand = ' sfdx force:auth:web:login';
          sfdxCommand += ' -a ' + orgName; // --setalias

      switch ( answers.orgType ) {
        case 'DevHub':
            sfdxCommand += ' -d '; // --setdefaultdevhubusername (boolean)
            break;
        case 'Production':
            sfdxCommand += ' -r ' + 'https://login.salesforce.com'; // --instanceurl
            break;
        case 'Sandbox':
            sfdxCommand += ' -r ' + 'https://test.salesforce.com'; // --instanceurl
            break;
        default:
          this.log(chalk.red('Sorry, no support yet for ' + answers.orgType + '.'));
      }
      
      if(answers.isDefault)
        sfdxCommand += ' -s '; // --setdefaultusername (boolean)

        this.log( "Run 🏄🏻‍ : " + chalk.magenta(sfdxCommand));
        this.loading.succeed(chalk.green('Opened connection successfully'));
        shell.exec(sfdxCommand);

        //shell.exit(1);
        this.composeWith(require.resolve('../app'));
        
      this.log("=========================");
    });
  }
    
  configuring() {
    
  }

  writing() {
    
  }

  end() {
    
  }

};
