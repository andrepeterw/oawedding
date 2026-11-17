/* Tells the website which country a visitor is in, so a few links can be shown only to
   visitors in Brazil (see js/main.js and the .brazil-only class in css/style.css).

   Vercel adds the header x-vercel-ip-country to every request, from the visitor's IP address.
   That is a best guess, not a guarantee: a VPN, a roaming mobile carrier or a company network
   can show the wrong country. It only decides which links appear. The pages themselves stay
   public, and no private information passes through here.

   GET /api/country  ->  {"country":"BR"}   (an empty string when it cannot be told, for example
   when running on a laptop, where there is no Vercel network). The answer differs per visitor, so it is never cached. */

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const raw = String((req.headers && req.headers['x-vercel-ip-country']) || '').trim().toUpperCase();
  const country = /^[A-Z]{2}$/.test(raw) ? raw : '';
  res.status(200).json({ country });
};
