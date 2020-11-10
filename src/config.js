const core = require('@actions/core');
const AWS = require('aws-sdk/global');
const EC2 = require('aws-sdk/clients/ec2');

const region = core.getInput('aws-region', { required: true });
const accessKeyId = core.getInput('aws-access-key-id', { required: true });
const secretAccessKey = core.getInput('aws-secret-access-key', { required: true });
const awsRoleArn = core.getInput('aws-role-arn', { required: false });
const awsSessionName = core.getInput('aws-session-name', { required: typeof awsRoleArn !== 'undefined'});
const awsDurationSeconds = parseInt(core.getInput('aws-duration-seconds', { required: false }));
const groupIds = core
  .getInput('aws-security-group-id', { required: true })
  .split(',')
  .map(item => item.trim());
const port = parseInt(core.getInput('port', { required: false }));
const description = core.getInput('description', { required: false });

AWS.config.update({
  region,
  accessKeyId,
  secretAccessKey,
});

async function getCredentials() {
  if (awsRoleArn) {
    const roleToAssume = {
      RoleArn: awsRoleArn,
      RoleSessionName: awsSessionName,
    };
    if (awsDurationSeconds) {
      roleToAssume['DurationSeconds'] = awsDurationSeconds;
    }
    const sts = new AWS.STS();
    const assumeRole = sts.assumeRole(roleToAssume).promise();
    await assumeRole.then(
      function(data) {
        const creds = {
          accessKeyId: data.Credentials.AccessKeyId,
          secretAccessKey: data.Credentials.SecretAccessKey,
          sessionToken: data.Credentials.SessionToken
        };
        core.info(`credentials: ${creds}`);
        return creds;
      },
      function(err) {
        console.log(err);
        core.setFailed(`Failed to assume role ${err}`);
      }
    );
  } else {
    return {};
  }
}

const ec2 = new EC2(getCredentials());

module.exports = {
  region,
  accessKeyId,
  secretAccessKey,
  groupIds,
  port,
  description,
  ec2,
};
