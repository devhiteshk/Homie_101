const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = (passport, UserModel) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NOTES_GOOGLE_CALLBACK_URL || '/api/notes/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await UserModel.findOne({ googleId: profile.id });
          if (user) return done(null, user);
          user = await UserModel.create({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
