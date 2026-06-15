<?php

namespace App\Repositories\Interfaces;

interface TransactionRepositoryInterface extends BaseRepositoryInterface
{
    public function findByUuid(string $uuid, array $relations = []);
    public function getFilteredTransactions(array $filters);
}
