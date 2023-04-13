import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsEmail, IsIn, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { ContainerState } from 'src/shared/models'
import {
  BasicNodeDto,
  NodeConnectionStatus,
  NodeType,
  NODE_CONNECTION_STATUS_VALUES,
  NODE_TYPE_VALUES,
} from '../shared/shared.dto'

export const NODE_SCRIPT_TYPE_VALUES = ['shell', 'powershell'] as const
export type NodeScriptTypeDto = (typeof NODE_SCRIPT_TYPE_VALUES)[number]

export class NodeDto extends BasicNodeDto {
  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  icon?: string

  @IsString()
  @IsOptional()
  address?: string

  @IsString()
  @IsIn(NODE_CONNECTION_STATUS_VALUES)
  @ApiProperty({
    enum: NODE_CONNECTION_STATUS_VALUES,
  })
  status?: NodeConnectionStatus

  @IsDate()
  @Type(() => Date)
  connectedAt?: Date

  @IsString()
  @IsOptional()
  version?: string

  @IsBoolean()
  @IsOptional()
  updating?: boolean
}

export class NodeInstallDto {
  @IsString()
  command: string

  @IsString()
  script: string

  @IsDate()
  @Type(() => Date)
  expireAt: Date
}

export class NodeDetailsDto extends NodeDto {
  @IsBoolean()
  hasToken: boolean

  @IsOptional()
  @ValidateNested()
  install?: NodeInstallDto
}

export class CreateNodeDto {
  @IsString()
  name: string

  @IsString()
  description?: string

  @IsString()
  icon?: string
}

export class UpdateNodeDto extends CreateNodeDto {}

export class DagentTraefikOptionsDto {
  @IsEmail()
  acmeEmail: string
}

export class NodeGenerateScriptDto {
  @IsString()
  @IsIn(NODE_TYPE_VALUES)
  @ApiProperty({
    enum: NODE_TYPE_VALUES,
  })
  type: NodeType

  @IsString()
  rootPath?: string

  @IsString()
  @IsIn(NODE_SCRIPT_TYPE_VALUES)
  @ApiProperty({
    enum: NODE_SCRIPT_TYPE_VALUES,
  })
  scriptType: NodeScriptTypeDto

  @IsObject()
  @ValidateNested()
  dagentTraefik?: DagentTraefikOptionsDto
}

export class ContainerIdentifierDto {
  @IsString()
  @IsOptional()
  prefix?: string

  @IsString()
  name: string
}

export type ContainerOperationDto = 'start' | 'stop' | 'restart'

export class NodeContainerCommandDto {
  @ValidateNested()
  container: ContainerIdentifierDto

  @ValidateNested()
  operation: ContainerOperationDto
}

export class NodeDeleteContainerDto {
  @IsObject()
  @IsOptional()
  @ValidateNested()
  container?: ContainerIdentifierDto

  @IsString()
  prefix?: string
}

export class ContainerPort {
  internal: number

  external: number
}

export class ContainerStatus {
  id: ContainerIdentifierDto

  command: string

  @Type(() => Date)
  @IsDate()
  createdAt: Date

  state: ContainerState

  status: string

  imageName: string

  imageTag: string

  ports: ContainerPort[]
}