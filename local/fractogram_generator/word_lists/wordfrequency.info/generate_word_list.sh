#! /bin/bash

sudo apt install -y python3-q-text-as-data
echo "Installed q."
echo ""

query="
SELECT
    lemma
FROM
    lemmas_60k_m3118.txt
WHERE
    length(lemma) = 5
    AND pos != 'u'
    AND lemma NOT LIKE '%-%'
ORDER BY
    rank DESC
"

rm five_letter_words.txt
# head -n 1 lemmas_60k_m3118.txt > five_letter_words.txt
q -t -H -O "$query" > five_letter_words.txt
