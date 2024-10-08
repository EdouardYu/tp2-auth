# Instructions for starting the project:

```shell
$ npm i
$ npm start
```

# Database notice:

Regarding the database, its name is "auth" and the name of the collection is "user".  
You just need to have MongoDB installed, the database and the collection will generate themselves if you have created a user from the web application.

# Notice on roles:

you have to do the update in the database to change the role of a user. Either from the graphical interface MongoDB Compass, or in command line with mongosh:

```shell
$ mongosh
$ use auth
$ db.user.update({username: 'username'},{$set:{role:'admin'}})
```

to check if the change has been made:

```shell
$ db.user.find({username: 'username'})
```
