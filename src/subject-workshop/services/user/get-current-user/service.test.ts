import {
  describe,
  expect, spyOn,
  test,
} from 'bun:test';
import { CurrentUser, GetCurrentUserActionDod, GetingCurrentUserOut } from 'cy-domain/src/subject/domain-data/user/get-current-user/s-params';
import { UserReadRepository } from 'cy-domain/src/subject/domain-object/user/read-repository';
import { WorkshopReadRepository } from 'cy-domain/src/workshop/domain-object/workshop/repository';
import { success } from 'rilata/src/common/result/success';
import { UuidType } from 'rilata/src/common/types';
import { dtoUtility } from 'rilata/src/common/utils/dto';
import { setAndGetTestStoreDispatcher } from 'rilata/tests/fixtures/test-thread-store-mock';
import { failure } from 'rilata/src/common/result/failure';
import { dodUtility } from 'rilata/src/common/utils/domain-object/dod-utility';
import { UserDoesNotExistError } from 'cy-domain/src/subject/domain-data/user/get-user/s-params';
import { GettingCurrentUserService } from './service';
import { SubjectServiceFixtures as fixtures } from '../fixtures';

describe('Тесты для use-case репозитория getCurrentUser', () => {
  const sut = new GettingCurrentUserService();
  sut.init(fixtures.resolver);

  const currentUser: CurrentUser = {
    userId: 'fa91a299-105b-4fb0-a056-92634249130c',
    telegramId: 5436134100,
    type: 'employee',
    userProfile: {
      firstName: 'Jack',
      lastName: 'Smith',
    },
    workshopId: '6f91d305-3f4b-4a3d-9bef-72cf3757cc33',
    workshopName: 'TheBestWorkshop',
  };

  const actionId: UuidType = 'pb8a83cf-25a3-2b4f-86e1-2744de6d8374';

  const validActionDod: GetCurrentUserActionDod = {
    meta: {
      name: 'getCurrentUser',
      actionId,
      domainType: 'action',
    },
    attrs: {
    },
  };

  test('успех, запрос для пользователя нормально проходит', async () => {
    const userRepo = fixtures.resolverGetUserWorkshopRepoMock(UserReadRepository) as
    UserReadRepository;
    const repoGetUserMock = spyOn(userRepo, 'getUser').mockResolvedValueOnce(success(dtoUtility.deepCopy(dtoUtility.excludeAttrs(currentUser, ['workshopId', 'workshopName']))));
    const workshopRepo = fixtures.resolverGetUserWorkshopRepoMock(WorkshopReadRepository) as
    WorkshopReadRepository;
    const getWorkshopMock = spyOn(workshopRepo, 'findById').mockResolvedValueOnce(dtoUtility.deepCopy(fixtures.workshop));
    setAndGetTestStoreDispatcher(actionId);
    const result = await sut.execute(dtoUtility.deepCopy(validActionDod));
    expect(result.isSuccess()).toBe(true);
    expect(result.value as GetingCurrentUserOut).toEqual(currentUser);
    expect(getWorkshopMock).toHaveBeenCalledTimes(1);
    expect(getWorkshopMock.mock.calls[0][0]).toEqual(
      'a29e2bfc-9f52-4f58-afbd-7a6f6f25d51e',
    );
    repoGetUserMock.mockClear();
  });

  test('Провал, мастерской с таким id не существует', async () => {
    const userRepo = fixtures.resolverGetUserWorkshopRepoMock(UserReadRepository) as
      UserReadRepository;
    const repoGetUserMock = spyOn(userRepo, 'getUser').mockResolvedValueOnce(success(dtoUtility.deepCopy(dtoUtility.excludeAttrs(currentUser, ['workshopId', 'workshopName']))));
    const workshopRepo = fixtures.resolverGetUserWorkshopRepoMock(WorkshopReadRepository) as
    WorkshopReadRepository;
    const getWorkshopMock = spyOn(workshopRepo, 'findById').mockResolvedValueOnce(undefined);
    getWorkshopMock.mockResolvedValueOnce(undefined);
    setAndGetTestStoreDispatcher(actionId);
    try {
      await sut.execute(validActionDod);
      expect(true).toBe(false);
    } catch (e) {
      const error = e as Error;
      expect(error).toBeDefined();
      expect(error.toString()).toContain('Error: Workshop-a с таким workshopId: a29e2bfc-9f52-4f58-afbd-7a6f6f25d51e не существует');
    }
    expect(getWorkshopMock).toHaveBeenCalledTimes(2);
    expect(getWorkshopMock.mock.calls[0][0]).toEqual(
      'a29e2bfc-9f52-4f58-afbd-7a6f6f25d51e',
    );
    expect(repoGetUserMock).toHaveBeenCalledTimes(1);
    expect(repoGetUserMock.mock.calls[0][0]).toEqual(
      'fb8a83cf-25a3-2b4f-86e1-27f6de6d8374',
    );
  });

  test('Провал, пользователя с таким id не существует', async () => {
    const userRepo = fixtures.resolverGetUserWorkshopRepoMock(UserReadRepository) as
    UserReadRepository;
    const repoGetUserMock = spyOn(userRepo, 'getUser').mockResolvedValueOnce(failure(dodUtility.getDomainErrorByType<UserDoesNotExistError>(
      'UserDoesNotExistError',
      'Такого пользователя не существует',
      {
        userId: currentUser.userId,
      },
    )));
    const workshopRepo = fixtures.resolverGetUserWorkshopRepoMock(WorkshopReadRepository) as
    WorkshopReadRepository;
    const getWorkshopMock = spyOn(workshopRepo, 'findById').mockResolvedValueOnce(dtoUtility.deepCopy(fixtures.workshop));
    getWorkshopMock.mockResolvedValueOnce(undefined);
    setAndGetTestStoreDispatcher(actionId);
    try {
      await sut.execute(validActionDod);
      expect(true).toBe(false);
    } catch (e) {
      const error = e as Error;
      expect(error).toBeDefined();
      expect(error.toString()).toContain('Error: Пользователь с id: fb8a83cf-25a3-2b4f-86e1-27f6de6d8374 подписонным токеном авторизации в базе данных не существует');
    }
    expect(getWorkshopMock).toHaveBeenCalledTimes(2);
    expect(getWorkshopMock.mock.calls[0][0]).toEqual(
      'a29e2bfc-9f52-4f58-afbd-7a6f6f25d51e',
    );
    expect(repoGetUserMock).toHaveBeenCalledTimes(2);
    expect(repoGetUserMock.mock.calls[0][0]).toEqual(
      'fb8a83cf-25a3-2b4f-86e1-27f6de6d8374',
    );
  });
});