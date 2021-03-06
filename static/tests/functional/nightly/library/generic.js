/*
 * Copyright 2016 Mirantis, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 **/

import ClusterPage from 'tests/functional/pages/cluster';
import 'tests/functional/helpers';

function GenericLib(remote) {
  this.remote = remote;
  this.clusterPage = new ClusterPage(this.remote);
}

GenericLib.prototype = {
  constructor: GenericLib,

  gotoPage(pageName) {
    var pageSelector = {Environments: 'clusters-page', Equipment: 'equipment-page',
      Releases: 'releases-page', Plugins: 'plugins-page', Support: 'support-page'};
    var pageTitle = {Environments: /My OpenStack Environments/i, Equipment: /Equipment/i,
      Releases: /Releases/i, Plugins: /Installed Plugins/i, Support: /Support/i};
    var activeName = RegExp(pageName, 'i');
    if (!(pageName in pageSelector)) {
      throw new Error('Invalid input value. Check pageName: "' + pageName +
        '" parameter and restart test.');
    }
    return this.remote
      .assertElementsAppear('ul.navbar-nav', 5000, 'Main navigation bar exists')
      .clickLinkByText(pageName)
      .assertElementsAppear('div.' + pageSelector[pageName], 5000, '"' + pageName +
        '" page is loaded')
      .assertElementMatchesRegExp('li.active a', activeName, '"' + pageName +
        '" page is selected')
      .assertElementMatchesRegExp('h1.title', pageTitle[pageName], '"' + pageName +
        '" page is opened');
  },

  checkMirantisRefsOnPage(page) {
    return this.remote
      .then(() => this.gotoPage(page))
      .assertElementNotExists('*[href*="mirantis"]', 'No Mirantis links on "' + page + '" page')
      .assertElementNotMatchesRegExp('.footer div', RegExp('Mirantis', 'i'),
        'No Mirantis names in footer text on page "' + page + '" page');
  },

  checkMirantisRefsOnTab(tab) {
    return this.remote
      .then(() => this.clusterPage.goToTab(tab))
      .assertElementNotExists('*[href*="mirantis"]', 'No Mirantis links on "' + tab + '" tab')
      .assertElementNotMatchesRegExp('.footer div', RegExp('Mirantis', 'i'),
        'No Mirantis names in footer text on page "' + tab + '" tab');
  }
};

export default GenericLib;
