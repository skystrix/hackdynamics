"""frameworks.py — Chapter 31, "Frameworks, Platforms, and Multimodal RAG".

Every framework ships a default chunker, every default is expressed in a
different unit, and nobody converts between them. This script does the
conversion on real text and then runs each framework's default splitting
POLICY over the Larkspur corpus so the resulting chunk sizes can be compared
against what Chapter 5 measured.

The splitters here are reimplementations of each library's documented default
behaviour, not the libraries themselves, so that the comparison needs no
install and stays reproducible. The parameter values are taken from source,
read 2026-09-04:

  LangChain   TextSplitter.__init__      chunk_size=4000  chunk_overlap=200
              (characters; length_function defaults to len)
  LlamaIndex  SentenceSplitter           chunk_size=DEFAULT_CHUNK_SIZE=1024
              chunk_overlap=SENTENCE_CHUNK_OVERLAP=200   (tokens)
  Haystack    DocumentSplitter           split_by="word" split_length=200
              split_overlap=0                            (words)

Measured:

  1. the conversion factors between characters, words and tokens on this
     corpus, so the three defaults can be stated in one unit;
  2. each default policy applied to the same text: chunk count and the
     token-size distribution of the chunks it produces;
  3. the overlap each default actually duplicates, as a share of the corpus.

    PYTHONPATH=<scratch>/pylib HF_HOME=<scratch>/hf python3 frameworks.py
"""

import re
import statistics

from querygap import CORPUS

# Defaults read from each project's source, 2026-09-04.
DEFAULTS = {
    "LangChain  RecursiveCharacterTextSplitter": (4000, 200, "characters"),
    "LlamaIndex SentenceSplitter":               (1024, 200, "tokens"),
    "Haystack   DocumentSplitter":               (200, 0, "words"),
}

# A document long enough that the largest default splits it many times. The
# Larkspur corpus is only ~1,900 tokens, so chunk counts there are too small to
# compare; this uses the same 50 pages of the Essential GraphRAG PDF that
# Chapter 17 measured real chunk sizes against, falling back to the corpus.
BOOK = "RAG_In_Depth/dokumen.pub_essential-graphrag-knowledge-graphenhanced-rag.pdf"


def load_doc():
    try:
        import os
        from pypdf import PdfReader
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), BOOK)
        pages = PdfReader(path).pages[30:80]
        text = "\n\n".join(pg.extract_text() or "" for pg in pages)
        if len(text) > 20000:
            return text, "50 pages of Essential GraphRAG"
    except Exception:
        pass
    return "\n\n".join(CORPUS), "the 56-passage Larkspur corpus"


DOC, DOC_NAME = load_doc()


def split_by_chars(text, size, overlap):
    """LangChain's recursive splitter, reduced to its size accounting: cut on
    the best available separator, never exceeding `size` characters."""
    seps = ["\n\n", "\n", " ", ""]

    def rec(t, seps):
        if len(t) <= size or not seps:
            return [t]
        sep = seps[0]
        parts = t.split(sep) if sep else list(t)
        out, buf = [], ""
        for p in parts:
            cand = (buf + sep + p) if buf else p
            if len(cand) <= size:
                buf = cand
            else:
                if buf:
                    out.append(buf)
                buf = p if len(p) <= size else ""
                if len(p) > size:
                    out.extend(rec(p, seps[1:]))
        if buf:
            out.append(buf)
        return out

    chunks = rec(text, seps)
    return stitch(chunks, overlap, len)


def split_by_words(text, size, overlap):
    words = text.split()
    step = max(1, size - overlap)
    return [" ".join(words[i:i + size]) for i in range(0, len(words), step)]


def stitch(chunks, overlap, measure):
    """Re-add a trailing overlap from the previous chunk, as the libraries do."""
    if not overlap:
        return chunks
    out = []
    for i, c in enumerate(chunks):
        if i and overlap:
            prev = chunks[i - 1]
            out.append(prev[-overlap:] + c)
        else:
            out.append(c)
    return out


def main():
    try:
        import tiktoken
    except ImportError:
        print("tiktoken not installed; nothing to measure.")
        return
    enc = tiktoken.get_encoding("cl100k_base")
    ntok = lambda s: len(enc.encode(s))

    chars, words, tokens = len(DOC), len(DOC.split()), ntok(DOC)
    print("=" * 74)
    print("1. THE CONVERSION FACTORS, on this corpus")
    print("=" * 74)
    print(f"\n  {DOC_NAME}: {chars:,} characters, "
          f"{words:,} words, {tokens:,} tokens")
    print(f"  characters per token  {chars / tokens:.2f}")
    print(f"  words per token       {words / tokens:.2f}")
    print(f"  characters per word   {chars / words:.2f}")

    cpt, wpt = chars / tokens, words / tokens
    print()
    print("=" * 74)
    print("2. THE THREE DEFAULTS IN ONE UNIT")
    print("=" * 74)
    print(f"\n  {'framework default':<44}{'as written':<20}{'in tokens':<12}"
          f"{'overlap'}")
    for name, (size, ov, unit) in DEFAULTS.items():
        if unit == "characters":
            tk, otk = size / cpt, ov / cpt
        elif unit == "words":
            tk, otk = size / wpt, ov / wpt
        else:
            tk, otk = size, ov
        print(f"  {name:<44}{f'{size} {unit}':<20}{tk:<12,.0f}"
              f"{ov / size:.0%} ({otk:,.0f} tok)")
    print("\n  Chapter 5 measured the recall knee at about 400 tokens, and found")
    print("  overlap bought nothing on those corpora.")

    print()
    print("=" * 74)
    print("3. EACH DEFAULT POLICY RUN OVER THE SAME TEXT")
    print("=" * 74)
    print(f"\n  {'framework default':<44}{'chunks':<10}{'median tok':<14}"
          f"{'p90 tok':<12}{'duplicated'}")
    for name, (size, ov, unit) in DEFAULTS.items():
        if unit == "characters":
            chunks = split_by_chars(DOC, size, ov)
        elif unit == "words":
            chunks = split_by_words(DOC, size, ov)
        else:
            # token splitter: pack whole sentences up to `size` tokens
            sents = re.split(r"(?<=[.!?])\s+", DOC)
            chunks, buf = [], ""
            for s in sents:
                cand = (buf + " " + s).strip()
                if ntok(cand) <= size:
                    buf = cand
                else:
                    if buf:
                        chunks.append(buf)
                    buf = s
            if buf:
                chunks.append(buf)
            chunks = stitch(chunks, int(ov * cpt), len)
        sizes = sorted(ntok(c) for c in chunks)
        dup = sum(sizes) / tokens - 1
        print(f"  {name:<44}{len(chunks):<10}{statistics.median(sizes):<14,.0f}"
              f"{sizes[int(0.9 * len(sizes)) - 1]:<12,.0f}{dup:+.0%}")

    print("\n  'duplicated' is how much larger the sum of the chunks is than the")
    print("  corpus: the overlap tax, paid on every embedding and every store.")


if __name__ == "__main__":
    main()
