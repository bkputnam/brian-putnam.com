# brian-putnam.com

## Hosting

This is hosted on Google App Engine. So far it's entirely static - ignore the Python config in app.yaml.

DNS is handled by digitalocean, and the domain registrar is namecheap.com.

## To deploy

First download and install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).

```
gcloud config set project brian-putnam
gcloud app deploy
```

If you have DNS problems you can access the site directly with:

```
gcloud app browse
```

## To test locally

Serves `www/` on `:8080`

```
./devserver.sh
```

Google App Engine probably has some sort of development environment, but for a simple static site like this a simple python server is sufficient.
