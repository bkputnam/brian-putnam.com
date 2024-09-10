#! /bin/bash

sudo apt install -y python3-q-text-as-data
echo "Installed q."
echo ""

query="
SELECT
    rank,
    word
FROM
    words_219k_m3118.txt
WHERE
    length(word) = 5
    AND word REGEXP '\w{5}'
ORDER BY
    rank ASC
"

rm five_letter_words.txt
# head -n 1 lemmas_60k_m3118.txt > five_letter_words.txt
q -t -H -O "$query" > five_letter_words.txt
