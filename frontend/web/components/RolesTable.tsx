import React, { FC } from 'react'
import CreateRole from './modals/CreateRole'
import { useGetRolesQuery } from 'common/services/useRole'
import { User, Role } from 'common/types/responses'
import PanelSearch from './PanelSearch'
import UserGroupStore from 'common/stores/user-group-store'
import Button from './base/forms/Button'
import ConfirmDeleteRole from './modals/ConfirmDeleteRole'
import Icon from './Icon'
import Panel from './base/grid/Panel'
const rolesWidths = [250, 100]

type RolesTableType = {
  organisationId: number
  users: User[]
}

const RolesTable: FC<RolesTableType> = ({ organisationId, users }) => {
  const groups = UserGroupStore.getGroups() // todo: this will become a hook
  const { data: roles } = useGetRolesQuery(
    { organisation_id: organisationId },
    { skip: !organisationId },
  )

  const createRole = () => {
    openModal(
      'Create Role',
      <CreateRole
        organisationId={organisationId}
        onComplete={() => {
          toast('Role Created')
          closeModal()
        }}
      />,
      'side-modal',
    )
  }
  const deleteRole = (role: Role) => {
    openModal(
      'Remove Role',
      <ConfirmDeleteRole
        role={role}
        onComplete={() => {
          toast('Role Deleted')
        }}
      />,
      'p-0',
    )
  }

  const editRole = (role: Role) => {
    openModal(
      'Edit Role and Permissions',
      <CreateRole
        organisationId={role.organisation}
        isEdit
        role={role}
        onComplete={() => {
          toast('Role Updated')
        }}
        users={users}
        groups={groups}
      />,
      'side-modal',
    )
  }
  return (
    <>
      <Row space className='mt-4'>
        <h5 className='m-b-0'>Roles</h5>
        <Button
          className='mr-2'
          id='btn-invite'
          onClick={() => createRole()}
          type='button'
        >
          Create Role
        </Button>
      </Row>
      <p className='fs-small lh-sm'>
        Create custom roles, assign permissions and keys to the role, and then
        you can assign roles to users and/or groups.
      </p>
      <PanelSearch
        id='org-members-list'
        className='no-pad'
        items={roles?.results || []}
        itemHeight={65}
        header={
          <Row className='table-header'>
            <div
              className='table-column'
              style={{
                width: rolesWidths[0],
              }}
            >
              Name
            </div>
            <div className='flex-fill table-column'>Description</div>
            <div
              style={{
                width: rolesWidths[1],
              }}
              className='table-column text-center'
            >
              Remove
            </div>
          </Row>
        }
        renderRow={(role: Role) => (
          <Row className='list-item clickable cursor-pointer' key={role.id}>
            <Row
              onClick={() => {
                editRole(role)
              }}
              className='table-column'
              style={{
                width: rolesWidths[0],
              }}
            >
              {role.name}
            </Row>
            <Row
              className='table-column flex-fill'
              onClick={() => {
                editRole(role)
              }}
            >
              {role.description}
            </Row>
            <div
              style={{
                width: rolesWidths[1],
              }}
              className='table-column text-center'
            >
              <Button
                id='remove-role'
                type='button'
                onClick={() => {
                  deleteRole(role)
                }}
                className='btn btn-with-icon'
              >
                <Icon name='trash-2' width={20} fill='#656D7B' />
              </Button>
            </div>
          </Row>
        )}
        renderNoResults={
          <Panel title={'Organisation roles'} className='no-pad'>
            <div className='search-list'>
              <Row className='list-item p-3 text-muted'>
                You currently have no organisation roles
              </Row>
            </div>
          </Panel>
        }
        isLoading={false}
      />
    </>
  )
}

export default RolesTable
