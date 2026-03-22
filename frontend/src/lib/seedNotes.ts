import type { Note } from '../types'

const now = new Date().toISOString()

export const SEED_NOTES: Note[] = [
  {
    id: 'seed-1-research',
    title: 'Research Paper Outline',
    folder: 'Research',
    tags: ['research', 'outline'],
    editorMode: 'rich',
    content: `<p><strong>Machine Learning in Healthcare</strong></p>
<p><strong>Topic:</strong> Ensemble methods for early detection. <em>Research question:</em> Can we improve accuracy over single-model baselines?</p>
<p><strong>Key sections</strong></p>
<ul>
<li><p>Introduction — problem statement, motivation, and baseline metrics</p></li>
<li><p>Related work — prior art in ML diagnostics</p></li>
<li><p>Methodology — architecture, training pipeline</p></li>
<li><p>Experiments — datasets, ablations</p></li>
<li><p>Conclusion — limitations, future work</p></li>
</ul>
<hr>
<p><strong>Formal definition</strong></p>
<p>Loss function: L = -Σ y_i log ŷ_i (cross-entropy).</p>
<blockquote><p><strong>Important:</strong> Ensure reproducibility — publish hyperparameters alongside the paper.</p></blockquote>
<ol>
<li><p>Run ablation on learning rate</p></li>
<li><p>Compare with PyTorch baseline</p></li>
</ol>
<pre><code class="language-python"># Example: training config
config = {
    "model": "resnet50",
    "epochs": 100,
    "lr": 1e-4
}
</code></pre>`,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'seed-2-lecture',
    title: 'Algorithms: Sorting & Complexity',
    folder: 'Lecture',
    tags: ['algorithms', 'lecture', 'cs'],
    editorMode: 'rich',
    content: `<p><span class="heading heading-1" data-inline-heading="1">Sorting &amp; Complexity</span></p>
<p><span class="heading heading-2" data-inline-heading="2">Main ideas</span></p>
<ul>
<li><p>Quicksort average case is <em>O(n log n)</em> — divide and conquer</p></li>
<li><p>Merge sort is <strong>stable</strong>; quicksort is <u>in-place</u></p></li>
<li><p>Heapsort guarantees <em>O(n log n)</em>. <s>Worst case O(n²) for quicksort</s></p></li>
</ul>
<blockquote><p>Remember: stable sort preserves relative order of equal elements.</p></blockquote>
<hr>
<p><span class="heading heading-3" data-inline-heading="3">Complexity comparison</span></p>
<p>Best vs worst: O(n log n) vs O(n²). Recurrence for merge sort: T(n) = 2T(n/2) + O(n)</p>
<pre><code class="language-python">def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
</code></pre>
<p><strong>Homework:</strong> See Wikipedia for Lomuto partitioning.</p>
<ol>
<li><p>Implement partition()</p></li>
<li><p>Compare random vs. nearly-sorted input</p></li>
</ol>`,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'seed-3-writing',
    title: 'Blog Post: On Minimalism',
    folder: 'Writing',
    tags: ['blog', 'philosophy'],
    editorMode: 'rich',
    content: `<p><span class="heading heading-1" data-inline-heading="1">On Minimalism</span></p>
<p><span class="heading heading-2" data-inline-heading="2">Opening</span></p>
<blockquote><p>Perfection is achieved not when there is <strong>nothing</strong> more to add, but when there is <em>nothing left</em> to take away.</p></blockquote>
<p>— <em>Antoine de Saint-Exupéry</em></p>
<p>Modern life offers <strong>endless options</strong>. We accumulate apps, notifications, commitments. The cost isn't just clutter — it's <u>cognitive load</u>. <s>Old intro: deleted</s>.</p>
<hr>
<p><span class="heading heading-3" data-inline-heading="3">The experiment</span></p>
<p>For one month, remove one non-essential thing each day:</p>
<ul>
<li><p>Apps you never open</p></li>
<li><p>Subscriptions that auto-renew</p></li>
<li><p>Recurring meetings</p></li>
</ul>
<p>By day 30, you'll see what actually matters. <a href="https://example.com">Read more</a>.</p>
<ol>
<li><p>Track removals in a <code>daily_log</code></p></li>
<li><p>Reflect each Sunday</p></li>
</ol>
<blockquote><p><em>Write the rest: anecdotes, counterarguments, and a "start here" section.</em></p></blockquote>`,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'seed-4-projects',
    title: 'API Design Notes',
    folder: 'Projects',
    tags: ['api', 'backend', 'design'],
    editorMode: 'rich',
    content: `<p><span class="heading heading-1" data-inline-heading="1">REST Best Practices</span></p>
<p><span class="heading heading-2" data-inline-heading="2">For v2</span></p>
<ol>
<li><p>Use plural nouns: /users not /user</p></li>
<li><p>Nested resources <u>only one level</u> deep</p></li>
<li><p>Return 201 for POST with Location header</p></li>
<li><p><s>Version in query string</s> — version in path or header</p></li>
</ol>
<ul>
<li><p>Idempotency keys for <em>POST</em>/<strong>PUT</strong></p></li>
<li><p>See OpenAPI 3.0 spec</p></li>
</ul>
<hr>
<blockquote><p>Consistency &gt; cleverness. If one endpoint uses snake_case, all should.</p></blockquote>
<p><span class="heading heading-3" data-inline-heading="3">Example response</span></p>
<p>Pagination: n = ceil(total/limit). Status codes: 200, 201, 400, 404, 500</p>
<pre><code class="language-json">{
  "id": "usr_abc123",
  "email": "user@example.com",
  "created_at": "2024-01-15T10:30:00Z",
  "meta": { "request_id": "req_xyz" }
}
</code></pre>`,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'seed-5-reading',
    title: 'Reading List — Q1',
    folder: 'Ideas',
    tags: ['reading', 'books'],
    editorMode: 'rich',
    content: `<p><span class="heading heading-1" data-inline-heading="1">Reading List</span></p>
<p><span class="heading heading-2" data-inline-heading="2">In progress</span></p>
<ul>
<li><p><em>Deep Work</em> by Cal Newport</p></li>
<li><p><em>Designing Data-Intensive Applications</em> — <u>systems &amp; storage</u></p></li>
<li><p><s>Already finished: skip</s></p></li>
</ul>
<hr>
<p><span class="heading heading-3" data-inline-heading="3">Queue (priority order)</span></p>
<ol>
<li><p>Atomic Habits — habit formation</p></li>
<li><p>The Mom Test — customer interviews</p></li>
<li><p>SICP — <strong>Structure and Interpretation</strong></p></li>
</ol>
<p>Pages per week goal: 7 × 20 = 140</p>
<blockquote><p>Read 20 pages before bed. <em>No screens after that.</em></p></blockquote>
<pre><code class="language-text">Format: Title — Author — priority (1-5)
</code></pre>`,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'seed-6-inbox',
    title: 'Quick Reference',
    folder: '',
    tags: ['reference', 'snippets'],
    editorMode: 'rich',
    content: `<p><span class="heading heading-1" data-inline-heading="1">Quick Reference</span></p>
<p><span class="heading heading-2" data-inline-heading="2">Git commands</span></p>
<p><strong>Common:</strong> <code>stash</code>, <em>pop</em>, <u>rebase</u>. <s>Deprecated: pull --rebase</s></p>
<pre><code class="language-bash">git stash                    # Save work in progress
git stash pop                # Restore
git log --oneline -5         # Recent commits
git diff main..HEAD          # Compare branches
</code></pre>
<hr>
<p><span class="heading heading-3" data-inline-heading="3">Regex cheatsheet</span></p>
<ul>
<li><p>\\d digits, \\w word chars</p></li>
<li><p>.*? non-greedy match</p></li>
<li><p>(?=...) positive lookahead</p></li>
</ul>
<ol>
<li><p>Test at regex101.com</p></li>
<li><p>Use <strong>PCRE</strong> mode</p></li>
</ol>
<blockquote><p>Keep this note handy for copy-paste.</p></blockquote>`,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'seed-7-research',
    title: 'Paper Notes: Attention Is All You Need',
    folder: 'Research',
    tags: ['transformer', 'nlp', 'paper'],
    editorMode: 'latex',
    content: `# Attention Is All You Need

## Core idea

Replace recurrence with self-attention. No **convolutional** or recurrent layers. *Pure* attention — <s>RNNs</s> discarded.

## Key equation — scaled dot-product attention

$$
\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V
$$

## Why scaling by $1/\\sqrt{d_k}$?

Dot products grow large in high dimensions; softmax gets peaked gradients. Scaling keeps values in a reasonable range. Use d_k from model config.

---

> "We found it beneficial to use multi-head attention, allowing the model to jointly attend to information from different representation subspaces."

### Implementation sketch

\`\`\`python
def attention(Q, K, V, d_k):
    scores = Q @ K.T / math.sqrt(d_k)
    weights = softmax(scores)
    return weights @ V
\`\`\`

## Takeaway

- Architecture matters
- Simple, parallelizable layers can surpass complex sequential models

1. Read the original paper
2. Implement multi-head attention
3. Compare to LSTM baseline`,
    createdAt: now,
    updatedAt: now,
  },
]
