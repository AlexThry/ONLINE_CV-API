import { Controller, Get, Param } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  // Endpoint pour récupérer les dépôts d'un utilisateur
  @Get('user/:username/repos/:perPage')
  async getUserRepos(@Param('username') username: string, @Param('perPage') perPage: number) {
    return await this.githubService.getUserRepos(username, perPage);
  }

  // Endpoint pour récupérer le nombre de commits pour un utilisateur par mois
  @Get('user/:username/commits-per-month')
  async getUserCommitsPerMonth(@Param('username') username: string) {
    return await this.githubService.getUserCommitsPerMonth(username);
  }

  // Endpoint pour récupérer les 4 langages les plus utilisés par un utilisateur
  @Get('user/:username/top-languages')
  async getTopLanguages(@Param('username') username: string) {
    return await this.githubService.getTopLanguages(username);
  }
}
