irlmoji
=======

Take a pic that looks like an emoji!

Install Yourself
================
* Create env.json (look at env.json.sample) and configure for local development
* Also copy that file to 'ansible/roles/app/templates/env.json.j2' and make
  sure it's configured for production
* Drop your SSL certificate into
  'ansible/roles/nginx/templates/irlmoji.com.key.j2' and
  'ansible/roles/nginx/templates/irlmoji.com.pem.j2'
* Copy some environment vars into
  'ansible/roles/db/templates/AWS_ACCESS_KEY_ID.j2',
  'ansible/roles/db/templates/AWS_SECRET_ACCESS_KEY.j2', and
  'ansible/roles/db/templates/WALE_S3_PREFIX.j2'.
* Fill in the vars at 'ansible/group_vars/appserver' (look at
  'ansible/group_vars/appserver.example')

TODO
====
* Tests (oops)
* Figure out why it doesn't work when in production mode (WTF!?)
* Parse Emoji upload
* About page
* Many many more things
* Lock down ports
* Make sure you don't have to tap on the emoji image itself but can tap on the
  whole row (iOS specifically.)