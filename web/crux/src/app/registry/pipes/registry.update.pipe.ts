import { Injectable, PipeTransform } from '@nestjs/common'
import PrismaService from 'src/services/prisma.service'
import { UpdateRegistryRequest } from 'src/grpc/protobuf/proto/crux'
import { PreconditionFailedException } from 'src/exception/errors'
import RegistryMapper from '../registry.mapper'

@Injectable()
export default class UpdateRegistryValidationPipe implements PipeTransform {
  constructor(private prisma: PrismaService, private mapper: RegistryMapper) {}

  async transform(req: UpdateRegistryRequest) {
    const used = await this.prisma.image.count({
      where: {
        registryId: req.id,
      },
      take: 1,
    })

    if (used === 0) {
      return req
    }

    const registry = await this.prisma.registry.findUniqueOrThrow({
      where: {
        id: req.id,
      },
    })

    const details = this.mapper.detailsToDb(req)

    const blackList = ['url', 'user', 'type', 'namespace', 'imageNamePrefix', 'apiUrl']

    blackList.forEach(it => {
      if (details[it] !== registry[it]) {
        throw new PreconditionFailedException({
          property: 'id',
          value: req.id,
          message: 'Registry is already in use.',
        })
      }
    })

    return req
  }
}