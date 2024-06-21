# brian-putnam.com

## Hosting

This is hosted on Google App Engine. So far it's entirely static - ignore the
Python config in app.yaml.

DNS is handled by digitalocean, and the domain registrar is namecheap.com.

## To deploy

First download and install
[Google Cloud SDK](https://cloud.google.com/sdk/docs/install).

```
./deploy.sh
```

If you have DNS problems you can access the site directly with:

```
gcloud app browse
```

## To test locally

```
./devserver.sh
```

This custom devserver reads in Google App Engine's `app.yaml` file and attempts
to emulate the static file serving routes with a simple NodeJS app.

Google Cloud does have a
[devserver script](https://cloud.google.com/appengine/docs/standard/tools/local-devserver-command?tab=python),
but it appears to be poorly supported. E.g. the Python version contains the
text, "We recommend that you use standard Python tools, such as virtualenv to
create isolated environments and pytest to run unit tests and integration tests,
rather than depending on dev_appserver" and the NodeJS version simply isn't
supported.

Regardless, I tried to get the official Python devserver working and couldn't
because it has a dependency on Python2.7 and my flavor of linux (Debian) doesn't
even provide Python2.7 anymore.

## Folder Structure

- `/local`: Contains scripts and utilities that are meant to be run locally
- `/www`: Contains static client-side files. Often contains `.ts` and the
    generated `.js` side-by-side for easier sourcemap serving

If we ever have a server, it'll probably live in `/server` or something like
that.
