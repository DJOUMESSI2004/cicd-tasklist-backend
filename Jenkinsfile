pipeline {
    agent any

    environment {
        // Variables modifiables selon votre configuration
        REGISTRY_USER    = 'ndongmo' // Votre utilisateur Docker Hub
        IMAGE_NAME       = 'cicd-tasklist-backend'
        IMAGE_TAG        = "${BUILD_NUMBER}" // Utilise le numéro de build Jenkins comme tag
        SONAR_PROJECT_KEY= 'wilfrid-tasklist-backend'
    }

    stages {
        stage('1. Installation des Dépendances') {
            steps {
                echo 'Installation des dépendances npm...'
                sh 'npm install'
            }
        }

        stage('2. Génération du Client Prisma') {
            steps {
                echo 'Génération du client Prisma...'
                sh 'npx prisma generate'
            }
        }

        stage('3. Tests Unitaires') {
            steps {
                echo 'Exécution des tests unitaires...'
                sh 'npm run test' 
                // Note: Ajustez la commande si votre package.json utilise un autre script (ex: npm run test:unit)
            }
        }

        stage('4. Tests End-to-End (E2E)') {
            steps {
                echo 'Exécution des tests end-to-end...'
                sh 'npm run test:e2e'
            }
        }

        stage('5. Analyse SonarQube') {
            steps {
                echo 'Lancement de l\'analyse SonarQube...'
                // Utilise le scanner configuré globalement dans Jenkins nommé 'SonarQubeScanner'
                withSonarQubeEnv('SonarQubeScanner') {
                    sh "sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.sources=."
                }
            }
        }

        stage('6. Vérification Quality Gate') {
            steps {
                echo 'Vérification de la Quality Gate SonarQube...'
                timeout(time: 5, unit: 'MINUTES') {
                    // Attend le retour de SonarQube pour bloquer le build en cas d'échec
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('7. Build de l\'image Docker') {
            steps {
                echo 'Construction de l\'image Docker...'
                sh "docker build -t ${REGISTRY_USER}/${IMAGE_NAME}:${IMAGE_TAG} ."
                // Crée aussi un tag 'latest' pour plus de commodité
                sh "docker tag ${REGISTRY_USER}/${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY_USER}/${IMAGE_NAME}"
            }
        }

        stage('8. Scan de l\'image avec Trivy') {
            steps {
                echo 'Scan de sécurité de l\'image Docker avec Trivy...'
                // --exit-code 0 permet de ne pas faire échouer le build tout de suite, mettez 1 si vous voulez bloquer en cas de faille critique
                sh "trivy image --severity HIGH,CRITICAL --exit-code 0 ${REGISTRY_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('9. Génération de la SBOM') {
            steps {
                echo 'Génération de la Software Bill of Materials (SBOM) avec Syft...'
                // Génère un fichier au format SPDX JSON par exemple
                sh "syft ${REGISTRY_USER}/${IMAGE_NAME}:${IMAGE_TAG} -o spdx-json=sbom.json"
                // Archive le fichier dans Jenkins pour pouvoir le télécharger après le build
                archiveArtifacts artifacts: 'sbom.json', allowEmptyArchive: false
            }
        }

        stage('10. Publication sur Docker Hub') {
            steps {
                echo 'Connexion et publication de l\'image sur Docker Hub...'
                // 'docker-hub-credentials' doit correspondre à l'ID de vos identifiants (Username/Password) configurés dans Jenkins
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    sh "docker push ${REGISTRY_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                    sh "docker push ${REGISTRY_USER}/${IMAGE_NAME}"
                }
            }
        }
    }

    post {
        always {
            echo 'Nettoyage des images Docker locales pour libérer de l\'espace...'
            sh "docker rmi ${REGISTRY_USER}/${IMAGE_NAME}:${IMAGE_TAG} || true"
            sh "docker rmi ${REGISTRY_USER}/${IMAGE_NAME} || true"
        }
        success {
            echo 'Pipeline exécutée avec succès ! Code validé, image scannée et publiée.'
        }
        failure {
            echo 'La pipeline a échoué. Vérifiez les logs des étapes ci-dessus.'
        }
    }
}