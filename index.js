const express = require('express')
const app = express()
const cors=require('cors')
const session = require('express-session')
const passport = require('passport')
const { google } = require('googleapis');
const {askGpt}=require('./gpt')
const {verification}=require('./nodemail')

const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
app.use(cors())
app.use(session({
    secret: "secret",
    resave: false ,
    saveUninitialized: true ,
}))

app.use(passport.initialize())
app.use(passport.session())


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

authUser = (request, accessToken, refreshToken, profile, done) => {
    const user = {
        id: profile.id,
        displayName: profile.displayName,
        accessToken:accessToken,
        refreshToken:refreshToken
    };
    return done(null, user);
}


passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/google/callback",
    passReqToCallback   : true
  }, authUser));


passport.serializeUser( (user, done) => { 
    console.log(`\n--------> Serialize User:`)
    console.log(user)
    done(null, user)
} )


passport.deserializeUser((user, done) => {
        console.log("\n--------- Deserialized User:")
        console.log(user)
        done (null, user)
}) 


app.listen(3001, () => console.log(`Server started on port 3001...`))


let count = 1
showlogs = (req, res, next) => {
    console.log("\n==============================")
    console.log(`------------>  ${count++}`)

    console.log(`\n req.session.passport -------> `)
    console.log(req.session.passport)
  
    console.log(`\n req.user -------> `) 
    console.log(req.user) 
  
    console.log("\n Session and Cookie")
    console.log(`req.session.id -------> ${req.session.id}`) 
    console.log(`req.session.cookie -------> `) 
    console.log(req.session.cookie) 
  
    console.log("===========================================\n")

    next()
}

app.use(showlogs)


app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly']
  })
);


app.get('/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/dashboard',
        failureRedirect: '/login'
}));

app.get("/login", (req, res) => {
    res.send("login please")
})



checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { return next() }
  res.redirect("/login")
}


app.get("/dashboard", checkAuthenticated, (req, res) => {
    res.send(`Login success, welcome ${req.user.displayName}, acces token is ${req.user.accessToken}, refresh token is ${req.user.refreshToken}`);
  })
  

app.post("/logout", (req,res) => {
    req.logOut()
    res.redirect("/login")
    console.log(`-------> User Logged out`)
})


app.get('/readMails', checkAuthenticated,(req, res) => {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
        access_token: req.user.accessToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    gmail.users.messages.list({
        userId: 'me',
        labelIds: ['INBOX'],
    }, (err, response) => {
        if (err) {
            console.error('The API returned an error:', err);
            res.status(500).json({ error: 'Failed to read emails' });
            return;
        }
        const messages = response.data.messages;
        if (messages.length) {
            const messageId = messages[0].id;
            gmail.users.messages.get({
                userId: 'me',
                id: messageId,
            }, async(err, response) => {
                if (err) {
                    console.error('The API returned an error:', err);
                    res.status(500).json({ error: 'Failed to fetch email details' });
                    return;
                }
                const emailContent = response.data.snippet;
                const sender = response.data.payload.headers.find(header => header.name === 'From').value;
const email = sender.match(/<([^>]+)>/);

                const result=await askGpt(emailContent)
                await verification(email[1],result,res)
                //res.status(200).json(result)
                //res.json({ email:email[1], emailContent });
            });
        } else {
            console.log('No messages found.');
            res.json({ messages: [] });
        }
    });
});
