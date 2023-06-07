import {
    BadRequestException,
    HttpException,
    Injectable,
    InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { FormationService } from "src/formation/services/formation.service";
import { CreateQuizDto } from "src/quiz/dto/create-quiz.dto";
import { QuizService } from "src/quiz/quiz.service";
import { CreateFormationChapterDto } from "./dto/create-formation_chapter.dto";
import {
    ChapterTypes,
    FormationChapter,
} from "./schemas/formation_chapter.schema";

@Injectable()
export class FormationChapterService {
    constructor(
        @InjectModel(FormationChapter.name)
        private readonly formationChapterModel: Model<FormationChapter>,
        private readonly formationService: FormationService,
        private readonly quizService: QuizService
    ) {}

    async createQuizChapter(
        formationId: string,
        createFormationChapterDto: CreateFormationChapterDto
    ) {
        try {
            const { chapter } = createFormationChapterDto;
            const quiz = createFormationChapterDto.data as CreateQuizDto;

            const newChapter = await this.formationChapterModel.create({
                formationId,
                ...chapter,
            });
            const savedChapter = await newChapter.save();

            const newQuiz = await this.quizService.createQuiz({
                ...quiz,
                chapterId: savedChapter.id,
            });

            return {
                ...savedChapter.toObject(),
                quiz: newQuiz.toObject(),
            };
        } catch (err) {
            console.log(err);
            if (err instanceof HttpException) throw err;
            throw new InternalServerErrorException(err.message);
        }
    }

    async createResourceChapter() {}

    async create(
        formationId: string,
        createFormationChapterDto: CreateFormationChapterDto
    ) {
        const exists = this.formationService.findOne(formationId);
        if (!exists) {
            throw new BadRequestException("Formation does not exist");
        }

        switch (createFormationChapterDto.chapter.type) {
            case ChapterTypes.QUIZ:
                return await this.createQuizChapter(
                    formationId,
                    createFormationChapterDto
                );

            case ChapterTypes.RESOURCE:
                return new InternalServerErrorException("Not implemented yet");

            default:
                throw new BadRequestException("Invalid chapter type");
        }
    }

    async findAllForAFormation(formationId: string) {
        return await this.formationChapterModel.find({ formationId });
    }

    async findOne(chapterId: string) {
        return await this.formationChapterModel.findById(chapterId);
    }

    async remove(id: string) {
        return await this.formationChapterModel.findByIdAndDelete({
            _id: id,
        });
    }
}
