# bkp_words

This is a custom word list for use in fractogram_generator. It is subject to
change over time.

Goals:

- Most people should look at a word and say, "yeah that's a real word"
    - OK: about, their, would
    - Not OK: aaaah, idyll
- Exclude offensive words, e.g. words that are sexual, religious, slurs, etc
    - Words that are sufficiently "old-timey" that most people wouldn't be
        offended anymore are OK, e.g.:
        - harlot (debatable)
        - wench (debatable)
        - limey (pretty sure no one cares about this anymore)
        - kraut (debatable)
    - Not OK:
        - skank
        - whore
- Exclude words generated from other words, like plurals and words ending in
    -ed, -y, -ing, etc.
    - Unless the generated word is sufficiently distinct from the base word
    - E.g. if the base word is used less than the generated word
    - E.g. if the generated word has a notably different meaning than the base
        word
    - OK:
        - funny (significantly different meaning than "fun")
        - lucky (used at least as much as "luck")
        - dirty (means "covered in dirt", not "like dirt" - this one is
            debatable)
    - Not OK:
        - goopy (means "like goop")
        - techy (means "like or having to do with tech")
- Exclude words that are only used in a specific phrase (e.g. fossil words)
    - Not OK:
        - ado (much ado)
        - amok (run amok)
        - bated (bated breath)
- Exclude proper nouns
    - Not OK:
        - Brian
    - Proper adjectives are OK though
        - Iraqi


## Version 1

Created by starting with a list from https://wordfrequency.info, which is a
database of english words and their frequencies in a large corpus of works
maintained by Mark Davies. I purchased the right to use this database from Mark
on 2024-08-16 for $295. The database was queried for 5-letter words and I
manually pruned the list to fit the guidelines above.

- Purchase agreement: see `../wordfrequency.info/wordfreq_60k_com.docx`
- Query that pulls out 5-letter words: `../wordfrequency.info/generate_word_list.sh`
    - Dumps results into `five_letter_words.txt`
- [Work sheet](https://docs.google.com/spreadsheets/d/1YAKzRN6GvUqxns9ZqWLstiQGIuYLEtnQuc1FTdmJr5U/edit?usp=sharing) where I manually filtered the list.

