<?php

namespace App\Repositories\Interfaces;

interface BranchRepositoryInterface extends BaseRepositoryInterface
{
    public function getActiveBranches();
}
