import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubService } from './github/github.service';
import { GithubController } from './github/github.controller';
import { config } from 'src/config/config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
  ],
  controllers: [AppController, GithubController],
  providers: [AppService, GithubService],
})
export class AppModule {}
