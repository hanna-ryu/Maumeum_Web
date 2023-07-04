import { prop, modelOptions } from '@typegoose/typegoose';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';

@modelOptions({ schemaOptions: { timestamps: true } })
class User {
  @prop({ required: true })
  public nickname!: string;

  @prop({ required: true, default: () => nanoid(4) })
  public nanoid!: string;

  @prop({ default: uuidv4 })
  public uuid!: string;

  @prop()
  public image?: string;

  @prop({ required: true, unique: true })
  public email!: string;

  @prop()
  public introduction?: string;

  @prop({ required: true, default: 'user' })
  public role!: string;

  @prop({ required: true })
  public password!: string;

  @prop({ required: true })
  public phone!: string;

  @prop({ required: true, default: 0 })
  public reportedTimes!: number;

  @prop({ default: false })
  public authorization!: boolean;

  @prop()
  public teamAuth_id?: string;

  @prop()
  public refreshToken?: string;
}

export { User };
