import React, { Component } from 'react'
import CreateFlagModal from 'components/modals/CreateFlag'
import TryIt from 'components/TryIt'
import FeatureRow from 'components/FeatureRow'
import FeatureListStore from 'common/stores/feature-list-store'
import ProjectStore from 'common/stores/project-store'
import Permission from 'common/providers/Permission'
import { getTags } from 'common/services/useTag'
import { getStore } from 'common/store'
import JSONReference from 'components/JSONReference'
import ConfigProvider from 'common/providers/ConfigProvider'
import Constants from 'common/constants'
import PageTitle from 'components/PageTitle'
import { rocket } from 'ionicons/icons'
import { IonIcon } from '@ionic/react'
import TableSortFilter from 'components/tables/TableSortFilter'
import TableSearchFilter from 'components/tables/TableSearchFilter'
import TableTagFilter from 'components/tables/TableTagFilter'
import { getViewMode, setViewMode } from 'common/useViewMode'
import TableFilterOptions from 'components/tables/TableFilterOptions'
import EnvironmentDocumentCodeHelp from 'components/EnvironmentDocumentCodeHelp'
import TableOwnerFilter from 'components/tables/TableOwnerFilter'
import TableGroupsFilter from 'components/tables/TableGroupsFilter'
import TableValueFilter from 'components/tables/TableValueFilter'

const FeaturesPage = class extends Component {
  static displayName = 'FeaturesPage'

  static contextTypes = {
    router: propTypes.object.isRequired,
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      group_owners: [],
      is_enabled: null,
      loadedOnce: false,
      owners: [],
      search: null,
      showArchived: false,
      sort: { label: 'Name', sortBy: 'name', sortOrder: 'asc' },
      tag_strategy: 'INTERSECTION',
      tags: [],
      value_search: null,
    }
    ES6Component(this)
    getTags(getStore(), {
      projectId: `${this.props.match.params.projectId}`,
    })
    AppActions.getFeatures(
      this.props.match.params.projectId,
      this.props.match.params.environmentId,
      true,
      this.state.search,
      this.state.sort,
      0,
      this.getFilter(),
    )
  }

  componentDidUpdate(prevProps) {
    const {
      match: { params },
    } = this.props
    const {
      match: { params: oldParams },
    } = prevProps
    if (
      params.environmentId !== oldParams.environmentId ||
      params.projectId !== oldParams.projectId
    ) {
      this.state.loadedOnce = false
      AppActions.getFeatures(
        params.projectId,
        params.environmentId,
        true,
        this.state.search,
        this.state.sort,
        0,
        this.getFilter(),
      )
    }
  }

  componentDidMount = () => {
    API.trackPage(Constants.pages.FEATURES)
    const {
      match: { params },
    } = this.props
    AsyncStorage.setItem(
      'lastEnv',
      JSON.stringify({
        environmentId: params.environmentId,
        orgId: AccountStore.getOrganisation().id,
        projectId: params.projectId,
      }),
    )
  }

  newFlag = () => {
    openModal(
      'New Feature',
      <CreateFlagModal
        environmentId={this.props.match.params.environmentId}
        projectId={this.props.match.params.projectId}
      />,
      'side-modal create-feature-modal',
    )
  }

  getFilter = () => ({
    group_owners: this.state.group_owners?.length
      ? this.state.group_owners
      : undefined,
    is_archived: this.state.showArchived,
    is_enabled:
      this.state.is_enabled === null ? undefined : this.state.is_enabled,
    owners: this.state.owners?.length ? this.state.owners : undefined,
    tag_strategy: this.state.tag_strategy,
    tags:
      !this.state.tags || !this.state.tags.length
        ? undefined
        : this.state.tags.join(','),
    value_search: this.state.value_search ? this.state.value_search : undefined,
  })

  onSave = (isCreate) => {
    toast(`${isCreate ? 'Created' : 'Updated'} Feature`)
  }

  onError = (error) => {
    // Kick user back out to projects
    this.setState({ error })
    if (!error?.name && !error?.initial_value) {
      // Could not determine field level error, show generic toast.
      toast(
        error.project ||
          'We could not create this feature, please check the name is not in use.',
        'danger',
      )
    }
  }

  filter = () => {
    AppActions.searchFeatures(
      this.props.match.params.projectId,
      this.props.match.params.environmentId,
      true,
      this.state.search,
      this.state.sort,
      0,
      this.getFilter(),
    )
  }

  createFeaturePermission(el) {
    return (
      <Permission
        level='project'
        permission='CREATE_FEATURE'
        id={this.props.match.params.projectId}
      >
        {({ permission }) =>
          permission
            ? el(permission)
            : Utils.renderWithPermission(
                permission,
                Constants.projectPermissions('Create Feature'),
                el(permission),
              )
        }
      </Permission>
    )
  }

  render() {
    const { environmentId, projectId } = this.props.match.params
    const readOnly = Utils.getFlagsmithHasFeature('read_only_mode')
    const enabledStateFilter = Utils.getFlagsmithHasFeature(
      'feature_enabled_state_filter',
    )
    const environment = ProjectStore.getEnvironment(environmentId)
    const ownersFilter = Utils.getFlagsmithHasFeature('owners_filter')
    return (
      <div
        data-test='features-page'
        id='features-page'
        className='app-container container'
      >
        <FeatureListProvider onSave={this.onSave} onError={this.onError}>
          {(
            {
              environmentFlags,
              maxFeaturesAllowed,
              projectFlags,
              totalFeatures,
            },
            { removeFlag, toggleFlag },
          ) => {
            const isLoading = !FeatureListStore.hasLoaded
            const featureLimitAlert = Utils.calculateRemainingLimitsPercentage(
              totalFeatures,
              maxFeaturesAllowed,
            )
            if (projectFlags?.length && !this.state.loadedOnce) {
              this.state.loadedOnce = true
            }
            return (
              <div className='features-page'>
                {isLoading && (!projectFlags || !projectFlags.length) && (
                  <div className='centered-container'>
                    <Loader />
                  </div>
                )}
                {(!isLoading || this.state.loadedOnce) && (
                  <div>
                    {this.state.loadedOnce ||
                    ((this.state.showArchived ||
                      typeof this.state.search === 'string' ||
                      !!this.state.tags.length) &&
                      !isLoading) ? (
                      <div>
                        {featureLimitAlert.percentage &&
                          Utils.displayLimitAlert(
                            'features',
                            featureLimitAlert.percentage,
                          )}
                        <PageTitle
                          title={'Features'}
                          cta={
                            <>
                              {this.state.loadedOnce ||
                              this.state.showArchived ||
                              this.state.tags?.length
                                ? this.createFeaturePermission((perm) => (
                                    <div className='text-right'>
                                      <Button
                                        disabled={
                                          !perm ||
                                          readOnly ||
                                          featureLimitAlert.percentage >= 100
                                        }
                                        data-test='show-create-feature-btn'
                                        id='show-create-feature-btn'
                                        onClick={this.newFlag}
                                      >
                                        Create Feature
                                      </Button>
                                    </div>
                                  ))
                                : null}
                            </>
                          }
                        >
                          View and manage{' '}
                          <Tooltip
                            title={
                              <Button className='fw-normal' theme='text'>
                                feature flags
                              </Button>
                            }
                            place='right'
                          >
                            {Constants.strings.FEATURE_FLAG_DESCRIPTION}
                          </Tooltip>{' '}
                          and{' '}
                          <Tooltip
                            title={
                              <Button className='fw-normal' theme='text'>
                                remote config
                              </Button>
                            }
                            place='right'
                          >
                            {Constants.strings.REMOTE_CONFIG_DESCRIPTION}
                          </Tooltip>{' '}
                          for your selected environment.
                        </PageTitle>
                        <Permission
                          level='environment'
                          permission={Utils.getManageFeaturePermission(
                            Utils.changeRequestsEnabled(
                              environment &&
                                environment.minimum_change_request_approvals,
                            ),
                          )}
                          id={this.props.match.params.environmentId}
                        >
                          {({ permission }) => (
                            <FormGroup className='mb-4'>
                              <PanelSearch
                                className='no-pad overflow-visible'
                                id='features-list'
                                renderSearchWithNoResults
                                itemHeight={65}
                                isLoading={FeatureListStore.isLoading}
                                paging={FeatureListStore.paging}
                                header={
                                  <Row className='table-header'>
                                    <div className='table-column flex-row flex-fill'>
                                      <TableSearchFilter
                                        onChange={(e) => {
                                          this.setState(
                                            {
                                              search:
                                                Utils.safeParseEventValue(e),
                                            },
                                            () => {
                                              AppActions.searchFeatures(
                                                this.props.match.params
                                                  .projectId,
                                                this.props.match.params
                                                  .environmentId,
                                                true,
                                                this.state.search,
                                                this.state.sort,
                                                0,
                                                this.getFilter(),
                                              )
                                            },
                                          )
                                        }}
                                        value={this.state.search}
                                      />
                                      <Row className='flex-fill justify-content-end'>
                                        <TableTagFilter
                                          useLocalStorage
                                          isLoading={FeatureListStore.isLoading}
                                          projectId={projectId}
                                          className='me-4'
                                          title='Tags'
                                          tagStrategy={this.state.tag_strategy}
                                          onChangeStrategy={(tag_strategy) => {
                                            this.setState(
                                              {
                                                tag_strategy,
                                              },
                                              this.filter,
                                            )
                                          }}
                                          value={this.state.tags}
                                          onToggleArchived={(value) => {
                                            if (
                                              value !== this.state.showArchived
                                            ) {
                                              FeatureListStore.isLoading = true
                                              this.setState(
                                                {
                                                  showArchived:
                                                    !this.state.showArchived,
                                                },
                                                this.filter,
                                              )
                                            }
                                          }}
                                          showArchived={this.state.showArchived}
                                          onClearAll={() => {
                                            FeatureListStore.isLoading = true
                                            this.setState(
                                              { showArchived: false, tags: [] },
                                              this.filter,
                                            )
                                          }}
                                          onChange={(tags) => {
                                            FeatureListStore.isLoading = true
                                            if (
                                              tags.includes('') &&
                                              tags.length > 1
                                            ) {
                                              if (
                                                !this.state.tags.includes('')
                                              ) {
                                                this.setState(
                                                  { tags: [''] },
                                                  this.filter,
                                                )
                                              } else {
                                                this.setState(
                                                  {
                                                    tags: tags.filter(
                                                      (v) => !!v,
                                                    ),
                                                  },
                                                  this.filter,
                                                )
                                              }
                                            } else {
                                              this.setState(
                                                { tags },
                                                this.filter,
                                              )
                                            }
                                            AsyncStorage.setItem(
                                              `${projectId}tags`,
                                              JSON.stringify(tags),
                                            )
                                          }}
                                        />
                                        {enabledStateFilter && (
                                          <TableValueFilter
                                            title={'State'}
                                            className={'me-4'}
                                            projectId={projectId}
                                            useLocalStorage
                                            value={{
                                              enabled: this.state.is_enabled,
                                              valueSearch:
                                                this.state.value_search,
                                            }}
                                            onChange={({
                                              enabled,
                                              valueSearch,
                                            }) => {
                                              this.setState(
                                                {
                                                  is_enabled: enabled,
                                                  value_search: valueSearch,
                                                },
                                                this.filter,
                                              )
                                            }}
                                          />
                                        )}
                                        {ownersFilter && (
                                          <TableOwnerFilter
                                            title={'Owners'}
                                            className={'me-4'}
                                            projectId={projectId}
                                            useLocalStorage
                                            value={this.state.owners}
                                            onChange={(owners) => {
                                              FeatureListStore.isLoading = true
                                              this.setState(
                                                {
                                                  owners: owners,
                                                },
                                                this.filter,
                                              )
                                            }}
                                          />
                                        )}
                                        {ownersFilter && (
                                          <TableGroupsFilter
                                            title={'Groups'}
                                            className={'me-4'}
                                            projectId={projectId}
                                            orgId={
                                              AccountStore.getOrganisation()?.id
                                            }
                                            useLocalStorage
                                            value={this.state.group_owners}
                                            onChange={(group_owners) => {
                                              FeatureListStore.isLoading = true
                                              this.setState(
                                                {
                                                  group_owners: group_owners,
                                                },
                                                this.filter,
                                              )
                                            }}
                                          />
                                        )}
                                        <TableFilterOptions
                                          title={'View'}
                                          className={'me-4'}
                                          value={getViewMode()}
                                          onChange={setViewMode}
                                          options={[
                                            {
                                              label: 'Default',
                                              value: 'default',
                                            },
                                            {
                                              label: 'Compact',
                                              value: 'compact',
                                            },
                                          ]}
                                        />
                                        <TableSortFilter
                                          isLoading={FeatureListStore.isLoading}
                                          value={this.state.sort}
                                          options={[
                                            {
                                              default: true,
                                              label: 'Name',
                                              order: 'asc',
                                              value: 'name',
                                            },
                                            {
                                              label: 'Created Date',
                                              order: 'asc',
                                              value: 'created_date',
                                            },
                                          ]}
                                          onChange={(sort) => {
                                            FeatureListStore.isLoading = true
                                            this.setState({ sort }, this.filter)
                                          }}
                                        />
                                      </Row>
                                    </div>
                                  </Row>
                                }
                                nextPage={() =>
                                  AppActions.getFeatures(
                                    this.props.match.params.projectId,
                                    this.props.match.params.environmentId,
                                    true,
                                    this.state.search,
                                    this.state.sort,
                                    FeatureListStore.paging.next,
                                    this.getFilter(),
                                  )
                                }
                                prevPage={() =>
                                  AppActions.getFeatures(
                                    this.props.match.params.projectId,
                                    this.props.match.params.environmentId,
                                    true,
                                    this.state.search,
                                    this.state.sort,
                                    FeatureListStore.paging.previous,
                                    this.getFilter(),
                                  )
                                }
                                goToPage={(page) =>
                                  AppActions.getFeatures(
                                    this.props.match.params.projectId,
                                    this.props.match.params.environmentId,
                                    true,
                                    this.state.search,
                                    this.state.sort,
                                    page,
                                    this.getFilter(),
                                  )
                                }
                                items={projectFlags?.filter((v) => !v.ignore)}
                                renderFooter={() => (
                                  <>
                                    <JSONReference
                                      className='mx-2 mt-4'
                                      showNamesButton
                                      title={'Features'}
                                      json={projectFlags}
                                    />
                                    <JSONReference
                                      className='mx-2'
                                      title={'Feature States'}
                                      json={
                                        environmentFlags &&
                                        Object.values(environmentFlags)
                                      }
                                    />
                                  </>
                                )}
                                renderRow={(projectFlag, i) => (
                                  <FeatureRow
                                    environmentFlags={environmentFlags}
                                    projectFlags={projectFlags}
                                    permission={permission}
                                    environmentId={environmentId}
                                    projectId={projectId}
                                    index={i}
                                    canDelete={permission}
                                    toggleFlag={toggleFlag}
                                    removeFlag={removeFlag}
                                    projectFlag={projectFlag}
                                  />
                                )}
                              />
                            </FormGroup>
                          )}
                        </Permission>
                        <FormGroup className='mt-5'>
                          <CodeHelp
                            title='1: Installing the SDK'
                            snippets={Constants.codeHelp.INSTALL}
                          />
                          <CodeHelp
                            title='2: Initialising your project'
                            snippets={Constants.codeHelp.INIT(
                              this.props.match.params.environmentId,
                              projectFlags?.[0]?.name,
                            )}
                          />
                          <EnvironmentDocumentCodeHelp
                            title='3: Providing feature defaults and support offline'
                            projectId={this.props.match.params.projectId}
                            environmentId={
                              this.props.match.params.environmentId
                            }
                          />
                        </FormGroup>
                        <FormGroup className='pb-4'>
                          <TryIt
                            title='Test what values are being returned from the API on this environment'
                            environmentId={
                              this.props.match.params.environmentId
                            }
                          />
                        </FormGroup>
                      </div>
                    ) : (
                      !isLoading && (
                        <div>
                          <h3>Brilliant! Now create your features.</h3>
                          <FormGroup>
                            <Panel
                              icon='ion-ios-settings'
                              title='1. configuring features per environment'
                            >
                              <p>
                                We've created 2 Environments for you:{' '}
                                <strong>Development</strong> and{' '}
                                <strong>Production</strong>. When you create a
                                Feature it makes copies of them for each
                                Environment, allowing you to edit the values
                                separately. You can create more Environments too
                                if you need to.
                              </p>
                            </Panel>
                          </FormGroup>
                          <FormGroup>
                            <Panel
                              icon='ion-ios-rocket'
                              title='2. creating a feature'
                            >
                              <p>
                                Features in Flagsmith are made up of two
                                different data types:
                                <ul>
                                  <li>
                                    <strong>Booleans</strong>: These allows you
                                    to toggle features on and off:
                                    <p className='faint'>
                                      EXAMPLE: You're working on a new messaging
                                      feature for your app but only want to show
                                      it in your Development Environment.
                                    </p>
                                  </li>
                                  <li>
                                    <strong>String Values</strong>:
                                    configuration for a particular feature
                                    <p className='faint'>
                                      EXAMPLE: This could be absolutely anything
                                      from a font size for a website/mobile app
                                      or an environment variable for a server
                                    </p>
                                  </li>
                                </ul>
                              </p>
                            </Panel>
                          </FormGroup>
                          <FormGroup>
                            <Panel
                              icon='ion-ios-person'
                              title='3. configuring features per user'
                            >
                              <p>
                                When users login to your application, you can{' '}
                                <strong>Identify</strong> them using one of our
                                SDKs, this will add them to the Identities page.
                                From there you can configure their Features.
                                We've created an example user for you which you
                                can see in the{' '}
                                <Link
                                  className='btn-link'
                                  to={`/project/${projectId}/environment/${environmentId}/users`}
                                >
                                  Identities page
                                </Link>
                                .
                                <p className='faint'>
                                  EXAMPLE: You're working on a new messaging
                                  feature for your app but only want to show it
                                  for that Identity.
                                </p>
                              </p>
                            </Panel>
                          </FormGroup>
                          {this.createFeaturePermission((perm) => (
                            <FormGroup className='text-center'>
                              <Button
                                disabled={!perm}
                                className='btn-lg btn-primary'
                                id='show-create-feature-btn'
                                data-test='show-create-feature-btn'
                                onClick={this.newFlag}
                              >
                                <div className='flex-row justify-content-center'>
                                  <IonIcon
                                    className='me-1'
                                    icon={rocket}
                                    style={{
                                      contain: 'none',
                                      height: '25px',
                                    }}
                                  />
                                  <span>Create your first Feature</span>
                                </div>
                              </Button>
                            </FormGroup>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          }}
        </FeatureListProvider>
      </div>
    )
  }
}

FeaturesPage.propTypes = {}

module.exports = ConfigProvider(FeaturesPage)
