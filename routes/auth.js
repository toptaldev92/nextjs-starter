/**
 * Add routes for authentication
 *
 * Also sets up dependancies for authentication:
 * - Adds sessions support to Express (with HTTP only cookies for security)
 * - Configures session store (defaults to a flat file store in /tmp/sessions)
 * - Adds protection for Cross Site Request Forgery attacks to all POST requests
 *
 * Normally some of this logic might be elsewhere (like server.js) but for the
 * purposes of this example all server logic related to authentication is here.
 */
"use strict"

const bodyParser = require('body-parser')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const nodemailer = require('nodemailer')
const csrf = require('lusca').csrf()
const uuid = require('uuid/v4')
const PassportConfig = require('./auth-passport')

exports.configure = (app, server, options) => {
  if (!options) options = {}
  
  if (!options.db || !options.db.models || !options.db.models.user)
    throw new Error("Database with user model is a required option!")
    
  const User = options.db.models.user

  // Base path for auth URLs
  const path = options.path || '/auth'

  // Directory for auth pages
  const pages = options.pages || 'auth'

  // The secret is used to encrypt/decrypt sessions (you should pass your own!)
  const secret = options.secret || 'AAAA-BBBB-CCCC-DDDD'
 
  // Configure session store (defaults to using file system)
  const store = options.store || new FileStore({ path: '/tmp/sessions', secret: secret })

  // Max session age in ms (default is 4 weeks)
  // NB: With 'rolling: true' passed to session() the session expiry time will 
  // be reset every time a user visits the site again before it expires.
  const maxAge =  options.maxAge || 60000 * 60 * 24 * 7 * 4
    
  // How often the client should revalidate the session in ms (default 60s)
  // Does not impact the session life on the server, but causes the client to
  // always refetch session info after N seconds has elapsed since last checked.
  // Sensible values are between 0 (always check the server) and a few minutes.
  const clientMaxAge = options.clientMaxAge || 60000

  // URL of the server (e.g. "http://www.example.com"). Used when sending 
  // sign-in emails. Autodetects current server hostname / domain if null.
  const serverUrl = options.serverUrl || null

  // Mailserver (defaults to sending from localhost if null)
  const mailserver = options.mailserver || null

  // Load body parser to handle POST requests
  server.use(bodyParser.json())
  server.use(bodyParser.urlencoded({ extended: true }))

  // Configure sessions
  server.use(session({
    secret: secret,
    store: store,
    resave: false,
    rolling: true,
    saveUninitialized: true,
    httpOnly: true,
    cookie: {
      maxAge: maxAge
    }
  }))

  // Add CSRF to all POST requests
  // (If you want to add exceptions to paths you can do that here)
  server.use((req, res, next) => {
    csrf(req, res, next)
  })
  
  // With sessions connfigured (& before routes) we need to configure Passport
  const passport = PassportConfig.configure(app, server, { db: options.db, path: path })
  
  // Add route to get CSRF token via AJAX
  server.get(path+'/csrf', (req, res) => {
    return res.json({ csrfToken: res.locals._csrf })
  })

  // Return session info
  server.get(path+'/session', (req, res) => {
    if (req.user) {
      return res.json({
        user: req.user,
        clientMaxAge: clientMaxAge,
        csrfToken: res.locals._csrf
      })
    } else {
      return res.json({ 
        clientMaxAge: clientMaxAge,
        csrfToken: res.locals._csrf
      })
    }
  })
  
  // On post request, redirect to page with instrutions to check email for link
  server.post(path+'/email/signin', (req, res) => {
    const email = req.body.email || null

    if (!email || email.trim() == '')
      return app.render(req, res, pages+'/signin', req.params)
    
    const token = uuid()
    const verificationUrl = (serverUrl || "http://"+req.headers.host)+path+'/email/signin/'+token

    // Create verification token save it to database
    // @TODO Error handling (i.e. don't send email unless it worked)
    User.one({ email: email }, function(err, user) {
      if (user) {
        user.token = token
        user.save(function(err) {
          if (err) throw err
        })
      } else {
        User.create({ email: email, token: token }, function(err) {
          if (err) throw err
        })
      }
    })

    nodemailer
    .createTransport(mailserver)
    .sendMail({
      to: email,
      from: "noreply@"+req.headers.host.split(":")[0],
      subject: 'Sign in link',
      text: 'Use the link below to sign in:\n\n'+
             verificationUrl+'\n\n'
    }, function(err) {
      // @TODO Handle errors
      if (err) console.log("Error sending email to "+email, err)
    })

    //console.log("Generated sign in link "+verificationUrl+" for "+email)
    
    return app.render(req, res, pages+'/check-email', req.params)
  })

  server.get(path+'/email/signin/:token', (req, res, next) => {
    if (!req.params.token)
      return res.redirect(path+'/signin')

    // Look up user by token
    User.one({ token: req.params.token }, function(err, user) {
      if (err) return res.redirect(path+'/error')
      if (user) {
        // Reset token and mark as verified
        user.token = null
        user.verified = true
        user.save(function(err) {
          // @TODO Improve error handling
          if (err) return res.redirect(path+'/error')
          
          // Having validated to the token, we log the user with Passport
         req.logIn(user, function(err) {
           if (err) return res.redirect(path+'/error')
           return res.redirect(path+'/success')
         })
        })
      } else {
        return res.redirect(path+'/error')
      }
    })
  })

  server.post(path+'/signout', (req, res) => {
    // Log user out by disassociating their account from the session
    req.logout()
    res.redirect('/')
  })
  
}

// This method works better for URLs than the default RegEx.escape method
const escape = function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}