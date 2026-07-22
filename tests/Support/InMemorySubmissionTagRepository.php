<?php

declare(strict_types=1);

namespace NeneContact\Tests\Support;

use NeneContact\Submission\SubmissionTagRepositoryInterface;

/**
 * In-memory submission-tag assignments for use-case tests. Tracks active (submission_id, tag_id)
 * pairs and records add/remove calls so behaviour can be asserted without a database.
 */
final class InMemorySubmissionTagRepository implements SubmissionTagRepositoryInterface
{
    /** @var list<array{submission: int, tag: int}> active assignments */
    private array $active = [];

    /** @var list<array{submission: int, tag: int, at: string}> */
    public array $added = [];

    /** @var list<array{submission: int, tag: int, at: string}> */
    public array $removed = [];

    /** @var array<int, list<array{id: int, label: string, color: string}>> seeded views by submission */
    public array $views = [];

    public function add(int $submissionId, int $tagId, string $createdAt): void
    {
        $this->added[] = ['submission' => $submissionId, 'tag' => $tagId, 'at' => $createdAt];
        foreach ($this->active as $pair) {
            if ($pair['submission'] === $submissionId && $pair['tag'] === $tagId) {
                return; // idempotent
            }
        }
        $this->active[] = ['submission' => $submissionId, 'tag' => $tagId];
    }

    public function remove(int $submissionId, int $tagId, string $deletedAt): void
    {
        $this->removed[] = ['submission' => $submissionId, 'tag' => $tagId, 'at' => $deletedAt];
        $this->active = array_values(array_filter(
            $this->active,
            static fn (array $p): bool => !($p['submission'] === $submissionId && $p['tag'] === $tagId),
        ));
    }

    public function findTagViewsForSubmission(int $submissionId): array
    {
        return $this->views[$submissionId] ?? [];
    }

    public function findTagViewsForSubmissions(array $submissionIds): array
    {
        $out = [];
        foreach ($submissionIds as $id) {
            if (isset($this->views[$id])) {
                $out[$id] = $this->views[$id];
            }
        }

        return $out;
    }

    public function activeCount(): int
    {
        return count($this->active);
    }
}
