window.COURSE = [
  {
    "id": 1,
    "title": "Map the Architecture",
    "track": "Foundations",
    "icon": "🗺️",
    "duration": "4–6 hours",
    "xp": 140,
    "outcome": "Explain how a request travels from the public internet to a Python container and then to Redis or PostgreSQL.",
    "lessons": [
      {
        "title": "Why this platform exists",
        "minutes": 18,
        "summary": "Understand the problem each component solves before touching AWS.",
        "sections": [
          {
            "heading": "A platform is a chain of responsibilities",
            "paragraphs": [
              "A production service is not only application code. It needs a way to receive traffic, run reliably, store data, keep secrets, expose logs, and recover from failure. The architecture separates those responsibilities so one component can change without redesigning everything.",
              "Our target platform uses Cloudflare optionally at the edge, an AWS Application Load Balancer as the public AWS entry point, ECS Fargate for containers, ElastiCache for Redis, RDS for PostgreSQL, CloudWatch for evidence, and Terraform for repeatability."
            ],
            "bullets": [
              "Edge: DNS, caching, WAF, and optional lightweight request logic.",
              "Load balancer: TLS termination, health checks, and traffic distribution.",
              "ECS Service: keeps the desired number of application tasks running.",
              "Data services: keep persistent or shared state outside disposable containers.",
              "Terraform: describes infrastructure as reviewed, versioned code."
            ]
          },
          {
            "heading": "The key mental model",
            "paragraphs": [
              "Containers are replaceable compute. Redis and PostgreSQL are stateful services. Never depend on files inside an ECS task surviving a restart. Design the application so a failed task can disappear and a new one can take over."
            ]
          }
        ],
        "task": "Draw the architecture with one sentence describing the responsibility of every box.",
        "check": "You can explain which components are public, private, disposable, and stateful without reading notes."
      },
      {
        "title": "Follow one request",
        "minutes": 22,
        "summary": "Trace traffic, identity, health checks, logs, and data access end to end.",
        "sections": [
          {
            "heading": "Request path",
            "paragraphs": [
              "A user resolves the domain and sends an HTTPS request. Cloudflare may inspect or cache it, then forwards it to the AWS load balancer. The load balancer chooses a healthy ECS task and forwards the request to the container port. The Python application may read cached data from Redis or durable data from PostgreSQL, then returns the response along the same route."
            ],
            "bullets": [
              "Security groups should allow the load balancer to reach the task port.",
              "Redis and PostgreSQL should accept traffic only from the application task security group.",
              "Health-check endpoints should be cheap and should not expose secrets.",
              "Application logs should go to standard output so the container runtime can collect them."
            ]
          },
          {
            "heading": "Identity path",
            "paragraphs": [
              "The ECS task execution role lets the platform pull images and send logs. The task role gives the application its own AWS permissions. Keeping those roles separate prevents application code from inheriting unnecessary deployment permissions."
            ]
          }
        ],
        "task": "Write a numbered request trace from browser to database and back. Mark every network boundary.",
        "check": "Your trace includes DNS, TLS, ALB, target group, task port, task role, Redis or database, logs, and response."
      },
      {
        "title": "Failure and trust boundaries",
        "minutes": 25,
        "summary": "Learn where systems fail and where permissions must stop.",
        "sections": [
          {
            "heading": "Expected failures",
            "paragraphs": [
              "Production design assumes components will fail. A task can crash, an image can be bad, a database connection can time out, or a health check can be incorrect. Reliability comes from detecting failure and limiting its impact, not pretending it will never happen."
            ],
            "bullets": [
              "Task crash: ECS replaces it.",
              "Bad deployment: deployment circuit breaker or rollback restores a healthy revision.",
              "Redis unavailable: application should degrade safely rather than corrupt durable data.",
              "Database unavailable: fail clearly, retry carefully, and alert.",
              "Load spike: autoscaling adds tasks within configured limits."
            ]
          },
          {
            "heading": "Trust boundaries",
            "paragraphs": [
              "A trust boundary is where data or identity moves between systems with different permissions. Public traffic, application tasks, data stores, CI/CD, and operators are separate boundaries. Each should have only the access it requires."
            ]
          }
        ],
        "task": "Add five failure scenarios and five trust boundaries to your architecture drawing.",
        "check": "For every failure you can name the detector, immediate impact, and recovery mechanism."
      }
    ],
    "quiz": [
      {
        "q": "Which component should keep a failed API container replaced?",
        "options": [
          "Cloudflare DNS",
          "ECS Service",
          "Redis",
          "Terraform state"
        ],
        "answer": 1,
        "explain": "The ECS Service continuously reconciles desired task count and replaces failed tasks."
      },
      {
        "q": "Where should durable application records normally live?",
        "options": [
          "Container filesystem",
          "ECR image layers",
          "PostgreSQL/RDS",
          "ALB access logs"
        ],
        "answer": 2,
        "explain": "Containers are replaceable; durable records belong in a persistent database."
      },
      {
        "q": "What is the main purpose of the task role?",
        "options": [
          "Give application code scoped AWS permissions",
          "Allow users to access the ALB",
          "Build the Docker image",
          "Store Terraform state"
        ],
        "answer": 0,
        "explain": "The task role is assumed by the running application, separate from the execution role."
      },
      {
        "q": "Why map failure paths before implementation?",
        "options": [
          "To remove the need for testing",
          "To choose recovery and monitoring deliberately",
          "To make Terraform shorter",
          "To avoid using health checks"
        ],
        "answer": 1,
        "explain": "Failure mapping reveals what must be detected, isolated, and recovered."
      }
    ]
  },
  {
    "id": 2,
    "title": "Build the Python Service",
    "track": "Application",
    "icon": "🐍",
    "duration": "6–9 hours",
    "xp": 180,
    "outcome": "Create a production-shaped Python API with validation, tests, health endpoints, configuration, and structured logs.",
    "lessons": [
      {
        "title": "Shape the service",
        "minutes": 24,
        "summary": "Build a small API with clear boundaries instead of one large file.",
        "sections": [
          {
            "heading": "Suggested structure",
            "paragraphs": [
              "Use a framework such as FastAPI, but organize the project so HTTP handlers, configuration, data access, and business rules are separate. This makes testing and later infrastructure changes easier."
            ],
            "code": "app/\n  main.py\n  api/routes.py\n  core/config.py\n  core/logging.py\n  services/\n  repositories/\ntests/\nrequirements.txt",
            "bullets": [
              "Handlers translate HTTP input and output.",
              "Services implement business rules.",
              "Repositories access Redis or PostgreSQL.",
              "Configuration reads environment variables and validates them at startup."
            ]
          },
          {
            "heading": "Start with one vertical slice",
            "paragraphs": [
              "Implement one resource end to end: create it, read it, validate it, and test it. Avoid creating many empty layers before one path works."
            ]
          }
        ],
        "task": "Create a /notes endpoint with create and read operations using an in-memory repository first.",
        "check": "A clean checkout can install dependencies and run the API with one documented command."
      },
      {
        "title": "Health, configuration, and logs",
        "minutes": 28,
        "summary": "Make the service observable and safe to configure in containers.",
        "sections": [
          {
            "heading": "Health endpoints",
            "paragraphs": [
              "Liveness answers whether the process is running. Readiness answers whether it can serve traffic. Keep liveness independent from optional dependencies so a temporary Redis issue does not create an endless restart loop."
            ],
            "code": "GET /health/live  -> 200 {\"status\":\"alive\"}\nGET /health/ready -> 200 or 503 with dependency status"
          },
          {
            "heading": "Twelve-factor configuration",
            "paragraphs": [
              "Read environment-specific values from environment variables or secrets, not hard-coded files. Validate required values during startup and redact secrets from logs."
            ],
            "bullets": [
              "Log as structured JSON.",
              "Include request ID, route, status, latency, and safe error details.",
              "Never log passwords, tokens, or full connection strings."
            ]
          }
        ],
        "task": "Add live and ready endpoints, typed configuration, and JSON request logging.",
        "check": "A missing required variable fails startup clearly, and a request produces a useful structured log line."
      },
      {
        "title": "Tests and graceful behavior",
        "minutes": 30,
        "summary": "Create fast feedback and predictable shutdown.",
        "sections": [
          {
            "heading": "Testing layers",
            "paragraphs": [
              "Unit tests verify business rules without AWS. API tests verify validation and responses. A small integration suite can run against local Redis and PostgreSQL later. Keep the majority fast and deterministic."
            ],
            "bullets": [
              "Test happy paths and invalid input.",
              "Test dependency failures explicitly.",
              "Use timeouts on external calls.",
              "Handle SIGTERM so in-flight requests can finish during ECS deployment."
            ]
          },
          {
            "heading": "Definition of production-shaped",
            "paragraphs": [
              "The service does not need every feature. It needs predictable startup, shutdown, configuration, errors, logs, and tests. Those qualities make infrastructure behavior understandable."
            ]
          }
        ],
        "task": "Add tests for valid, invalid, and dependency-failure cases. Add graceful shutdown hooks.",
        "check": "The test suite passes locally and the process exits cleanly when terminated."
      }
    ],
    "quiz": [
      {
        "q": "What should a liveness endpoint primarily prove?",
        "options": [
          "The process is alive",
          "Every downstream service is perfect",
          "The database has backups",
          "The image is in ECR"
        ],
        "answer": 0,
        "explain": "Liveness should show the process is running; readiness can include serving dependencies."
      },
      {
        "q": "Where should environment-specific secrets be supplied?",
        "options": [
          "Committed source code",
          "Docker image labels",
          "Environment or secret injection",
          "Public health response"
        ],
        "answer": 2,
        "explain": "Secrets should be injected at runtime and never committed or baked into images."
      },
      {
        "q": "Why use structured logs?",
        "options": [
          "They are shorter to type",
          "Machines can filter and aggregate consistent fields",
          "They eliminate all exceptions",
          "They replace metrics"
        ],
        "answer": 1,
        "explain": "Structured fields make logs searchable and useful for dashboards and incident investigation."
      },
      {
        "q": "What is graceful shutdown useful for?",
        "options": [
          "Finishing in-flight work during task replacement",
          "Making images immutable",
          "Creating VPCs",
          "Encrypting Terraform state"
        ],
        "answer": 0,
        "explain": "ECS deployments terminate tasks; graceful shutdown reduces dropped requests and partial work."
      }
    ]
  },
  {
    "id": 3,
    "title": "Containerize Locally",
    "track": "Containers",
    "icon": "📦",
    "duration": "6–10 hours",
    "xp": 180,
    "outcome": "Build a small, secure Docker image and run the API, Redis, and PostgreSQL locally as a repeatable stack.",
    "lessons": [
      {
        "title": "Images, layers, and cache",
        "minutes": 24,
        "summary": "Understand what Docker builds and why instruction order matters.",
        "sections": [
          {
            "heading": "An image is a reproducible filesystem plus metadata",
            "paragraphs": [
              "Each Dockerfile instruction creates a cached layer. Put stable dependency installation before frequently changing application code so rebuilds remain fast. Use a small trusted base image and pin important dependency versions."
            ],
            "code": "FROM python:3.13-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY app ./app\nCMD [\"python\", \"-m\", \"app.main\"]"
          },
          {
            "heading": "Build context matters",
            "paragraphs": [
              "A .dockerignore prevents secrets, virtual environments, test caches, and Git history from entering the build context. Smaller contexts are faster and safer."
            ]
          }
        ],
        "task": "Create the first Dockerfile and .dockerignore, then compare clean and cached build times.",
        "check": "The image starts the API without mounting local source code."
      },
      {
        "title": "Harden the runtime image",
        "minutes": 26,
        "summary": "Reduce privileges, size, and accidental content.",
        "sections": [
          {
            "heading": "Run as non-root",
            "paragraphs": [
              "Most application containers do not need root. Create a dedicated user, copy only runtime files, and ensure writable directories are explicit."
            ],
            "bullets": [
              "Use multi-stage builds when compilers are needed.",
              "Pin image versions or digests for controlled updates.",
              "Do not store credentials in ARG or ENV during build.",
              "Add a container-level health command only when it provides value beyond the orchestrator check."
            ]
          },
          {
            "heading": "Signals and ports",
            "paragraphs": [
              "Use exec-form commands so the application receives termination signals. Document the listening port, but remember EXPOSE does not publish it by itself."
            ]
          }
        ],
        "task": "Make the image run as a non-root user and inspect its effective user and contents.",
        "check": "The API works as non-root and the final image contains no source-control metadata or secrets."
      },
      {
        "title": "Compose the local platform",
        "minutes": 30,
        "summary": "Run service dependencies through names, health checks, and volumes.",
        "sections": [
          {
            "heading": "Local networking",
            "paragraphs": [
              "Docker Compose creates a network where services can reach one another by service name. The API should connect to redis:6379 and db:5432 inside that network, not localhost."
            ],
            "code": "services:\n  api:\n    build: .\n    depends_on: [redis, db]\n  redis:\n    image: redis:7\n  db:\n    image: postgres:17\n    volumes: [pgdata:/var/lib/postgresql/data]"
          },
          {
            "heading": "Repeatability over cleverness",
            "paragraphs": [
              "One documented command should start the stack. Add health checks and migrations so a new contributor can reproduce the environment without manual steps."
            ]
          }
        ],
        "task": "Create compose.yaml with API, Redis, PostgreSQL, health checks, and a named database volume.",
        "check": "docker compose up starts a working stack from a clean machine after environment setup."
      }
    ],
    "quiz": [
      {
        "q": "Why copy requirements before application source in many Dockerfiles?",
        "options": [
          "To improve build cache reuse",
          "To expose the port",
          "To create an ALB",
          "To encrypt secrets"
        ],
        "answer": 0,
        "explain": "Dependencies change less often, so their installation layer can remain cached."
      },
      {
        "q": "Inside Compose, how should the API reach the Redis container?",
        "options": [
          "localhost",
          "The public IP",
          "The Redis service name",
          "The ECR digest"
        ],
        "answer": 2,
        "explain": "Compose DNS resolves service names on the shared network."
      },
      {
        "q": "Why use a non-root container user?",
        "options": [
          "To reduce impact if the process is compromised",
          "To make Python faster",
          "To replace IAM",
          "To create persistent volumes"
        ],
        "answer": 0,
        "explain": "Lower privileges reduce the container process blast radius."
      },
      {
        "q": "What persists PostgreSQL data across local container recreation?",
        "options": [
          "EXPOSE",
          "A named volume",
          "A Docker label",
          "The API health endpoint"
        ],
        "answer": 1,
        "explain": "A named volume stores database files outside the disposable container layer."
      }
    ]
  },
  {
    "id": 4,
    "title": "Secure the AWS Sandbox",
    "track": "AWS",
    "icon": "🔐",
    "duration": "4–7 hours",
    "xp": 160,
    "outcome": "Create an AWS learning environment with safe identity, budgets, CLI access, and an emergency shutdown plan.",
    "lessons": [
      {
        "title": "Account guardrails first",
        "minutes": 22,
        "summary": "Protect the account before provisioning resources.",
        "sections": [
          {
            "heading": "Root user is not a daily user",
            "paragraphs": [
              "Protect the root account with MFA and use roles or an IAM identity for normal work. Store recovery details securely. Cloud projects are easier to learn when accidental spend and access risks are controlled first."
            ],
            "bullets": [
              "Enable MFA.",
              "Create budget alerts before infrastructure.",
              "Choose one region for the project.",
              "Tag every resource with project and environment."
            ]
          },
          {
            "heading": "Define a kill switch",
            "paragraphs": [
              "Document how to scale ECS to zero, remove costly data services, and run terraform destroy safely. A kill switch is part of the architecture, not an afterthought."
            ]
          }
        ],
        "task": "Create an account safety checklist and a monthly budget alert.",
        "check": "You can state who has access, where alerts go, and how to stop spend quickly."
      },
      {
        "title": "CLI profiles and roles",
        "minutes": 24,
        "summary": "Use named credentials and short-lived access where possible.",
        "sections": [
          {
            "heading": "Separate human and workload identity",
            "paragraphs": [
              "Humans authenticate to perform operations. Workloads assume roles at runtime. CI/CD should use federation such as OIDC rather than long-lived access keys."
            ],
            "code": "aws sts get-caller-identity\naws configure list\naws configure list-profiles"
          },
          {
            "heading": "Know your active identity",
            "paragraphs": [
              "Before every destructive command, verify the account, region, and role. Many cloud incidents begin with the right command in the wrong account."
            ]
          }
        ],
        "task": "Configure a named CLI profile and create a preflight script that prints account and region.",
        "check": "The preflight output makes the active account and region obvious before Terraform runs."
      },
      {
        "title": "Least privilege and secrets",
        "minutes": 28,
        "summary": "Give identities only the actions and resources they require.",
        "sections": [
          {
            "heading": "Start narrow, expand deliberately",
            "paragraphs": [
              "During learning it is tempting to attach broad administrator policies permanently. Instead, use a controlled sandbox role and document every permission the platform needs. Application secrets belong in a secret store and should be injected at runtime."
            ],
            "bullets": [
              "Execution role: image pull and logging.",
              "Task role: application AWS API access.",
              "CI role: deployment actions only.",
              "Human role: reviewed administrative scope."
            ]
          },
          {
            "heading": "Avoid secret sprawl",
            "paragraphs": [
              "Do not put secrets in Terraform variables committed to Git, Docker build arguments, shell history, or application logs."
            ]
          }
        ],
        "task": "Create an identity matrix covering human, CI, task execution, and application task roles.",
        "check": "Every role has a named owner, purpose, and explicit permission boundary."
      }
    ],
    "quiz": [
      {
        "q": "Which identity should be avoided for daily AWS work?",
        "options": [
          "ECS task role",
          "Root user",
          "CI OIDC role",
          "Named CLI role"
        ],
        "answer": 1,
        "explain": "The root user should be protected and reserved for rare account-level operations."
      },
      {
        "q": "What should you verify before running destructive Terraform?",
        "options": [
          "Only the Git branch",
          "Account, role, region, and plan",
          "The browser theme",
          "Redis TTL"
        ],
        "answer": 1,
        "explain": "Identity and target environment verification prevents wrong-account changes."
      },
      {
        "q": "Why prefer OIDC for CI/CD?",
        "options": [
          "It creates temporary federated credentials",
          "It makes containers persistent",
          "It replaces tests",
          "It publishes DNS automatically"
        ],
        "answer": 0,
        "explain": "OIDC lets CI obtain short-lived credentials without stored AWS access keys."
      },
      {
        "q": "Where should application secrets normally live?",
        "options": [
          "Git repository",
          "Dockerfile",
          "Managed secret store",
          "Public environment documentation"
        ],
        "answer": 2,
        "explain": "A managed secret store supports controlled access and rotation."
      }
    ]
  },
  {
    "id": 5,
    "title": "Design the VPC",
    "track": "Networking",
    "icon": "🌐",
    "duration": "8–12 hours",
    "xp": 220,
    "outcome": "Design public and private traffic paths across multiple availability zones with security-group-based access.",
    "lessons": [
      {
        "title": "CIDRs, subnets, and zones",
        "minutes": 28,
        "summary": "Turn one address range into a resilient network layout.",
        "sections": [
          {
            "heading": "The VPC is the private address space",
            "paragraphs": [
              "Choose a CIDR that does not overlap likely connected networks. Split it into subnets across at least two availability zones. Public and private are routing properties, not labels."
            ],
            "bullets": [
              "Public subnet: route to an internet gateway and public-facing resources.",
              "Private app subnet: ECS tasks without public IPs.",
              "Private data subnet: database and cache placement.",
              "Availability zones: isolate failure domains."
            ]
          },
          {
            "heading": "Keep the first design understandable",
            "paragraphs": [
              "A small project can use two public and two private subnets. Separate data subnets when you want clearer controls, but do not add complexity without a reason."
            ]
          }
        ],
        "task": "Create a CIDR plan and subnet table with zone, purpose, and route destination.",
        "check": "Every planned resource has a subnet placement and an explanation."
      },
      {
        "title": "Routes, gateways, and cost",
        "minutes": 30,
        "summary": "Understand how packets leave and enter the network.",
        "sections": [
          {
            "heading": "Ingress and egress are different",
            "paragraphs": [
              "The internet gateway enables public routing. Private tasks often need outbound access for package APIs or third-party services, commonly through a NAT gateway. NAT gateways add meaningful fixed and data-processing cost, so evaluate VPC endpoints and whether egress is required."
            ],
            "bullets": [
              "ALB subnets route to the internet gateway.",
              "Private task subnets route outbound through NAT or controlled alternatives.",
              "Data subnets normally have no direct internet route.",
              "Route tables decide paths; security groups decide allowed conversations."
            ]
          },
          {
            "heading": "VPC endpoints",
            "paragraphs": [
              "Endpoints can keep traffic to AWS services such as ECR, S3, and CloudWatch on the AWS network and may reduce NAT dependence. They also add their own cost and policy surface."
            ]
          }
        ],
        "task": "Draw inbound and outbound routes for ALB, ECS, ECR, logs, Redis, and database traffic.",
        "check": "You can identify which paths require internet, NAT, or an endpoint."
      },
      {
        "title": "Security groups as relationships",
        "minutes": 28,
        "summary": "Allow component-to-component traffic instead of broad IP ranges.",
        "sections": [
          {
            "heading": "Reference groups, not the world",
            "paragraphs": [
              "A strong design expresses relationships: the ALB group accepts public HTTPS; the task group accepts the application port from the ALB group; Redis and database groups accept their ports from the task group."
            ],
            "code": "Internet -> ALB SG : 443\nALB SG -> Task SG : 8000\nTask SG -> Redis SG : 6379\nTask SG -> DB SG : 5432"
          },
          {
            "heading": "Security groups are stateful",
            "paragraphs": [
              "Return traffic for an allowed connection is automatically permitted. Keep rules minimal and name them by intent."
            ]
          }
        ],
        "task": "Create a security-group matrix listing source, destination, port, and reason.",
        "check": "Redis and PostgreSQL have no public source rules, and tasks accept application traffic only from the ALB."
      }
    ],
    "quiz": [
      {
        "q": "What makes a subnet public?",
        "options": [
          "Its name contains public",
          "Its route table has an internet path and resources can use it",
          "It contains Redis",
          "It is in the first availability zone"
        ],
        "answer": 1,
        "explain": "Public status comes from routing and resource addressing, not labels."
      },
      {
        "q": "Who should be allowed to connect to Redis?",
        "options": [
          "0.0.0.0/0",
          "Only the application task security group",
          "Only Cloudflare",
          "Any resource in AWS"
        ],
        "answer": 1,
        "explain": "Reference the task security group to express the required relationship."
      },
      {
        "q": "Why can NAT gateways matter in a learning project?",
        "options": [
          "They add recurring and processing costs",
          "They store Terraform state",
          "They build images",
          "They replace subnets"
        ],
        "answer": 0,
        "explain": "NAT gateways can be a significant baseline cost and should be designed deliberately."
      },
      {
        "q": "Why use multiple availability zones?",
        "options": [
          "To increase Docker layer cache",
          "To avoid one zone being a single failure domain",
          "To remove IAM roles",
          "To make Redis public"
        ],
        "answer": 1,
        "explain": "Spreading resources reduces dependence on one physical zone."
      }
    ]
  },
  {
    "id": 6,
    "title": "Write Terraform",
    "track": "Infrastructure as Code",
    "icon": "🏗️",
    "duration": "10–16 hours",
    "xp": 260,
    "outcome": "Create reviewable Terraform that can plan, apply, destroy, and recreate the platform safely.",
    "lessons": [
      {
        "title": "Resources, data, variables, outputs",
        "minutes": 30,
        "summary": "Learn the small set of Terraform concepts used everywhere.",
        "sections": [
          {
            "heading": "Desired state",
            "paragraphs": [
              "Terraform configuration describes the desired infrastructure. Providers read current remote state, calculate a plan, and call APIs to reconcile differences. Treat the plan as a change proposal, not a guarantee that every runtime effect is harmless."
            ],
            "code": "resource \"aws_vpc\" \"main\" {\n  cidr_block = var.vpc_cidr\n  tags = local.common_tags\n}\n\noutput \"vpc_id\" { value = aws_vpc.main.id }"
          },
          {
            "heading": "Stable inputs and useful outputs",
            "paragraphs": [
              "Variables define intentional differences between environments. Locals reduce repetition. Outputs expose identifiers required by other modules or operators."
            ]
          }
        ],
        "task": "Provision a tagged VPC with variables, locals, and outputs.",
        "check": "terraform fmt, validate, plan, apply, and destroy all work from documented commands."
      },
      {
        "title": "State and collaboration",
        "minutes": 28,
        "summary": "Understand why state is sensitive and how teams share it.",
        "sections": [
          {
            "heading": "State maps configuration to real objects",
            "paragraphs": [
              "Terraform state can contain resource identifiers and sensitive values. Store it remotely with encryption and locking when collaborating. Do not edit state manually unless following a deliberate recovery procedure."
            ],
            "bullets": [
              "Never commit local state files.",
              "Restrict backend access.",
              "Enable versioning where supported.",
              "Back up before risky state operations."
            ]
          },
          {
            "heading": "State boundaries",
            "paragraphs": [
              "Separate state when components have different lifecycles, owners, or risk. One giant state file makes every change more coupled; too many tiny states create dependency overhead."
            ]
          }
        ],
        "task": "Configure a remote backend strategy and document bootstrap steps.",
        "check": "A second workstation or CI can safely plan without copying local state."
      },
      {
        "title": "Modules and safe changes",
        "minutes": 32,
        "summary": "Structure code without hiding important behavior.",
        "sections": [
          {
            "heading": "Modules are interfaces",
            "paragraphs": [
              "A module should group resources that form a coherent capability, such as networking or ECS service infrastructure. Keep inputs explicit and outputs small. Avoid deeply nested generic modules before you understand the raw resources."
            ],
            "bullets": [
              "Review replacement actions carefully.",
              "Pin provider versions.",
              "Use lifecycle rules sparingly.",
              "Run formatting, validation, and policy checks in CI."
            ]
          },
          {
            "heading": "Plan literacy",
            "paragraphs": [
              "Learn the symbols for create, update, destroy, and replace. A small textual change can recreate a database or load balancer if the underlying property is immutable."
            ]
          }
        ],
        "task": "Create network and service modules, then make a safe change and explain every plan action.",
        "check": "You can predict which resources change before applying and recognize unexpected replacement."
      }
    ],
    "quiz": [
      {
        "q": "What does Terraform state primarily do?",
        "options": [
          "Store application logs",
          "Map configuration to managed remote objects",
          "Run Python tests",
          "Cache Redis keys"
        ],
        "answer": 1,
        "explain": "State records Terraform’s view of managed infrastructure and resource identities."
      },
      {
        "q": "Why review a plan carefully?",
        "options": [
          "A property change may replace important resources",
          "Plans always contain passwords",
          "It builds the Docker image",
          "It proves the app works"
        ],
        "answer": 0,
        "explain": "Replacement and dependency effects can be destructive even when configuration changes look small."
      },
      {
        "q": "When is a module useful?",
        "options": [
          "When it groups a coherent capability behind a clear interface",
          "For every individual resource",
          "Only for public modules",
          "To avoid using variables"
        ],
        "answer": 0,
        "explain": "Good modules represent meaningful capabilities and reduce repetition without hiding behavior."
      },
      {
        "q": "Should Terraform state be committed to Git?",
        "options": [
          "Always",
          "Only on Fridays",
          "No, use a controlled backend",
          "Only if Redis is private"
        ],
        "answer": 2,
        "explain": "State can be sensitive and must be coordinated; a remote protected backend is appropriate."
      }
    ]
  },
  {
    "id": 7,
    "title": "Publish to Amazon ECR",
    "track": "Registry",
    "icon": "🏷️",
    "duration": "4–6 hours",
    "xp": 150,
    "outcome": "Publish traceable application images with immutable deployment references and lifecycle controls.",
    "lessons": [
      {
        "title": "Repositories, tags, and digests",
        "minutes": 22,
        "summary": "Know the difference between a convenient label and immutable content identity.",
        "sections": [
          {
            "heading": "Tags can move; digests identify content",
            "paragraphs": [
              "A tag such as main or latest may point to different images over time. A digest identifies exact image content. Use commit-based tags for traceability and record the deployed digest for reliable rollback."
            ],
            "code": "docker tag api:local ACCOUNT.dkr.ecr.REGION.amazonaws.com/api:GIT_SHA\ndocker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/api:GIT_SHA"
          },
          {
            "heading": "Repository policy",
            "paragraphs": [
              "Control who can push, pull, and delete. The ECS execution role needs pull access; CI needs controlled push access."
            ]
          }
        ],
        "task": "Create an ECR repository and push an image tagged with a Git commit SHA.",
        "check": "You can map a running task revision to the exact source commit and image digest."
      },
      {
        "title": "Scanning and lifecycle",
        "minutes": 24,
        "summary": "Reduce stale artifacts and make vulnerabilities visible.",
        "sections": [
          {
            "heading": "Scanning is evidence, not automatic safety",
            "paragraphs": [
              "Enable image scanning and define how critical findings block or escalate a release. Scanners can report vulnerabilities in base images and dependencies, but the team still needs an update and exception process."
            ],
            "bullets": [
              "Keep release images needed for rollback.",
              "Expire untagged or old development images.",
              "Protect stable tags from accidental overwrite.",
              "Patch base images through regular rebuilds."
            ]
          },
          {
            "heading": "Retention balances rollback and cost",
            "paragraphs": [
              "Do not delete the only known-good image. Lifecycle policies should preserve recent releases and remove unreferenced build artifacts."
            ]
          }
        ],
        "task": "Add a lifecycle policy and document vulnerability severity handling.",
        "check": "Old untagged images expire while recent release images remain available."
      },
      {
        "title": "Deployment traceability",
        "minutes": 20,
        "summary": "Connect source, CI run, image, task definition, and release.",
        "sections": [
          {
            "heading": "One release chain",
            "paragraphs": [
              "A useful release record links the source commit to tests, the built image digest, the ECS task definition revision, and the deployment result. This reduces guesswork during rollback."
            ],
            "bullets": [
              "Build once; promote the same artifact.",
              "Do not rebuild a different image for production from the same commit.",
              "Expose version information safely in application metadata or logs."
            ]
          }
        ],
        "task": "Create a RELEASE.md template containing commit, image digest, task revision, date, and rollback target.",
        "check": "Given a production task, you can identify its exact source and CI build."
      }
    ],
    "quiz": [
      {
        "q": "Which image reference is immutable?",
        "options": [
          "latest tag",
          "main tag",
          "Image digest",
          "Repository name"
        ],
        "answer": 2,
        "explain": "A digest identifies exact image content; tags can be reassigned."
      },
      {
        "q": "Why keep recent release images?",
        "options": [
          "For reliable rollback",
          "To replace CloudWatch",
          "To make subnets private",
          "To create IAM users"
        ],
        "answer": 0,
        "explain": "Rollback requires a known-good artifact to remain available."
      },
      {
        "q": "Who normally pulls the image for an ECS task?",
        "options": [
          "The task execution role",
          "The database user",
          "Cloudflare DNS",
          "The Redis client"
        ],
        "answer": 0,
        "explain": "The task execution role supports platform operations such as pulling images and writing logs."
      },
      {
        "q": "What should a release record connect?",
        "options": [
          "Commit, CI, image digest, task revision, result",
          "Only the image tag",
          "Only the domain name",
          "Only the developer name"
        ],
        "answer": 0,
        "explain": "End-to-end traceability makes incidents and rollback much faster."
      }
    ]
  },
  {
    "id": 8,
    "title": "Run on ECS Fargate",
    "track": "Orchestration",
    "icon": "🚀",
    "duration": "10–16 hours",
    "xp": 280,
    "outcome": "Deploy the API using a task definition, ECS Service, load balancer, roles, health checks, and controlled rolling updates.",
    "lessons": [
      {
        "title": "Task definition anatomy",
        "minutes": 30,
        "summary": "Describe exactly how one application task should run.",
        "sections": [
          {
            "heading": "A task definition is a versioned runtime blueprint",
            "paragraphs": [
              "It specifies image, CPU, memory, command, ports, environment, secrets, logging, health behavior, and IAM roles. Registering a change creates a new revision; existing tasks keep running until a service deploys the new revision."
            ],
            "bullets": [
              "Execution role: pull image and deliver logs.",
              "Task role: permissions available to application code.",
              "Port mapping: container listener used by the target group.",
              "Log configuration: send stdout and stderr to CloudWatch."
            ]
          },
          {
            "heading": "Resource sizing",
            "paragraphs": [
              "Choose a valid Fargate CPU and memory combination. Start with measured needs and headroom, not arbitrary large values. Under-sizing causes throttling or out-of-memory exits; over-sizing wastes money."
            ]
          }
        ],
        "task": "Create a task definition in Terraform and inspect the rendered JSON before apply.",
        "check": "The task starts, pulls the exact image, receives configuration, and writes logs."
      },
      {
        "title": "Service and load balancer",
        "minutes": 32,
        "summary": "Keep tasks healthy and route only to ready targets.",
        "sections": [
          {
            "heading": "The service reconciles desired state",
            "paragraphs": [
              "The ECS Service maintains desired count and performs deployments. It registers tasks in the ALB target group, monitors health, and starts replacements when tasks fail."
            ],
            "bullets": [
              "Use private subnets and no public task IP.",
              "Set health-check path and grace period intentionally.",
              "Configure minimum and maximum healthy percentages.",
              "Enable deployment circuit breaker with rollback where appropriate."
            ]
          },
          {
            "heading": "Health is a contract",
            "paragraphs": [
              "The target group health check must match the container port, path, response code, and startup timing. Many first ECS failures are mismatches in this contract."
            ]
          }
        ],
        "task": "Deploy two tasks behind an ALB and verify both become healthy targets.",
        "check": "The public endpoint responds and tasks are reachable only through the load balancer."
      },
      {
        "title": "Failure and rolling deployment",
        "minutes": 30,
        "summary": "Observe orchestration rather than assuming it works.",
        "sections": [
          {
            "heading": "Deliberately stop a task",
            "paragraphs": [
              "Stopping a task is a safe demonstration of reconciliation. Watch the desired, pending, and running counts, target registration, and logs as the service creates a replacement."
            ],
            "bullets": [
              "Deploy a new image revision.",
              "Observe old and new tasks overlap.",
              "Verify connection draining before old tasks stop.",
              "Test a bad health check in a safe environment and watch rollback."
            ]
          },
          {
            "heading": "Events tell the story",
            "paragraphs": [
              "ECS Service events, stopped-task reasons, target health descriptions, and application logs are the first evidence when a deployment stalls."
            ]
          }
        ],
        "task": "Run a replacement drill and a controlled rolling deployment. Save the evidence.",
        "check": "You can diagnose why a task stopped and explain the full deployment sequence."
      }
    ],
    "quiz": [
      {
        "q": "What creates a new task definition revision?",
        "options": [
          "Changing and registering the task definition",
          "Restarting Redis",
          "Opening the ALB URL",
          "Running a database query"
        ],
        "answer": 0,
        "explain": "Task definitions are versioned; each registered change creates a revision."
      },
      {
        "q": "What does desired count mean?",
        "options": [
          "The number of tasks the service should maintain",
          "The number of Redis keys",
          "The number of Git branches",
          "The number of availability zones in AWS"
        ],
        "answer": 0,
        "explain": "The ECS Service continuously attempts to maintain the desired number of tasks."
      },
      {
        "q": "Why can a task run but never receive traffic?",
        "options": [
          "It may fail target-group health checks",
          "Its image has a digest",
          "Terraform has outputs",
          "The VPC uses CIDR notation"
        ],
        "answer": 0,
        "explain": "The service may be running while the ALB considers the target unhealthy due to path, port, code, or timing."
      },
      {
        "q": "Where should ECS application logs normally be written?",
        "options": [
          "Only to files inside the container",
          "stdout/stderr collected by the log driver",
          "Into the Docker image",
          "Into Terraform state"
        ],
        "answer": 1,
        "explain": "Container output can be collected centrally by CloudWatch logging configuration."
      }
    ]
  },
  {
    "id": 9,
    "title": "Add Redis and PostgreSQL",
    "track": "Data",
    "icon": "🗄️",
    "duration": "12–18 hours",
    "xp": 300,
    "outcome": "Use Redis for temporary fast state and PostgreSQL for durable relational data without coupling either to application containers.",
    "lessons": [
      {
        "title": "Cache-aside with Redis",
        "minutes": 30,
        "summary": "Speed up reads while preserving a durable source of truth.",
        "sections": [
          {
            "heading": "Cache-aside flow",
            "paragraphs": [
              "The application checks Redis first. On a miss it reads PostgreSQL, returns the result, and stores a copy with a TTL. Writes update the database and then invalidate or update the cache. PostgreSQL remains the source of truth."
            ],
            "code": "value = redis.get(key)\nif value is None:\n    value = db.load(id)\n    redis.setex(key, ttl, serialize(value))\nreturn value"
          },
          {
            "heading": "Caching creates consistency choices",
            "paragraphs": [
              "TTL, invalidation, key design, and failure behavior must be explicit. A stale cache is sometimes acceptable for seconds; for security or financial decisions it may not be."
            ]
          }
        ],
        "task": "Add a cached read endpoint and prove hit, miss, TTL, and invalidation behavior.",
        "check": "Redis failure degrades predictably and does not lose durable records."
      },
      {
        "title": "Queues, sessions, and safe limits",
        "minutes": 28,
        "summary": "Use Redis deliberately rather than as a universal database.",
        "sections": [
          {
            "heading": "Temporary coordination",
            "paragraphs": [
              "Redis can support rate limits, sessions, locks, and job queues. Each pattern has failure and delivery semantics. A simple queue may deliver more than once, so workers should be idempotent."
            ],
            "bullets": [
              "Use bounded key TTLs where possible.",
              "Avoid unbounded cardinality.",
              "Do not store irreplaceable data only in a cache.",
              "Monitor memory and eviction policy."
            ]
          },
          {
            "heading": "Separate background work",
            "paragraphs": [
              "A worker can run as another ECS Service using the same image with a different command. It consumes jobs and writes durable outcomes to PostgreSQL."
            ]
          }
        ],
        "task": "Add one idempotent background job and a worker process.",
        "check": "Retrying the same job does not create duplicate durable results."
      },
      {
        "title": "PostgreSQL lifecycle",
        "minutes": 32,
        "summary": "Manage schema, connections, backups, and private access.",
        "sections": [
          {
            "heading": "Migrations are release artifacts",
            "paragraphs": [
              "Schema changes must be versioned and reviewed. Prefer backward-compatible migrations so old and new application tasks can overlap during a rolling deployment."
            ],
            "bullets": [
              "Use connection pooling.",
              "Set connect and statement timeouts.",
              "Enable backups and define retention.",
              "Restrict network access to the task security group."
            ]
          },
          {
            "heading": "Do not run migrations from every task blindly",
            "paragraphs": [
              "Concurrent task startup can race. Use a controlled migration step or a safe migration tool with locking and clear failure handling."
            ]
          }
        ],
        "task": "Provision a private database, run migrations through a controlled process, and restore test data.",
        "check": "The database is private, backed up, and a recovery test has succeeded."
      }
    ],
    "quiz": [
      {
        "q": "In cache-aside, what remains the source of truth?",
        "options": [
          "Redis",
          "PostgreSQL",
          "The ALB",
          "The container filesystem"
        ],
        "answer": 1,
        "explain": "Redis stores a temporary copy; durable data remains in PostgreSQL."
      },
      {
        "q": "Why should a background job be idempotent?",
        "options": [
          "Queues may deliver or retry work more than once",
          "It makes the VPC public",
          "It removes the need for logs",
          "It creates a Docker image"
        ],
        "answer": 0,
        "explain": "Idempotency makes repeated delivery safe and prevents duplicate effects."
      },
      {
        "q": "Why prefer backward-compatible migrations during rolling deployment?",
        "options": [
          "Old and new tasks may run at the same time",
          "Redis requires it",
          "ECR tags cannot move",
          "Cloudflare only supports old schemas"
        ],
        "answer": 0,
        "explain": "Overlapping application versions must both work with the schema during deployment."
      },
      {
        "q": "Should Redis contain the only copy of critical records?",
        "options": [
          "Yes, always",
          "No, not when loss is unacceptable",
          "Only if the ALB is public",
          "Only in two zones"
        ],
        "answer": 1,
        "explain": "Caches are optimized for temporary fast state and may evict or lose data depending on configuration."
      }
    ]
  },
  {
    "id": 10,
    "title": "Automate CI/CD",
    "track": "Delivery",
    "icon": "🔁",
    "duration": "8–14 hours",
    "xp": 240,
    "outcome": "Test, build, scan, publish, plan, and deploy through a controlled GitHub Actions workflow using temporary AWS credentials.",
    "lessons": [
      {
        "title": "Design the pipeline",
        "minutes": 28,
        "summary": "Turn release steps into explicit gates and artifacts.",
        "sections": [
          {
            "heading": "A useful pipeline has stages",
            "paragraphs": [
              "A push should not immediately mutate production. Separate fast validation, tests, image build, security checks, publish, Terraform plan, approval, deployment, and verification."
            ],
            "code": "lint -> test -> build -> scan -> push -> plan -> approve -> deploy -> verify"
          },
          {
            "heading": "Fail early",
            "paragraphs": [
              "Run cheap deterministic checks first. Do not spend time building or deploying code that fails formatting, type checks, or unit tests."
            ]
          }
        ],
        "task": "Write a pipeline diagram with inputs, outputs, permissions, and failure behavior for each job.",
        "check": "Every deployment artifact was produced by a passing, traceable workflow."
      },
      {
        "title": "OIDC and permissions",
        "minutes": 30,
        "summary": "Replace long-lived AWS keys with short-lived federation.",
        "sections": [
          {
            "heading": "Trust the workflow identity narrowly",
            "paragraphs": [
              "GitHub Actions can present an OIDC token that AWS validates. The role trust policy should restrict repository, branch or environment, and expected audience. The permissions policy should include only required deployment actions."
            ],
            "bullets": [
              "Do not store AWS access keys as repository secrets.",
              "Use separate roles or permissions for plan and apply when useful.",
              "Protect production environments with reviewers.",
              "Pin third-party actions to trusted versions or commits."
            ]
          },
          {
            "heading": "Supply-chain awareness",
            "paragraphs": [
              "CI executes code with meaningful permissions. Review actions, dependency installation, generated artifacts, and secret exposure."
            ]
          }
        ],
        "task": "Configure an AWS OIDC role and verify the workflow receives a temporary identity.",
        "check": "No long-lived AWS secret is stored in GitHub, and the role cannot be assumed from an untrusted branch."
      },
      {
        "title": "Deploy and verify",
        "minutes": 30,
        "summary": "Make deployment completion mean healthy service, not merely successful API calls.",
        "sections": [
          {
            "heading": "Wait for stability",
            "paragraphs": [
              "After updating the task definition or service, wait for ECS stability and run an external smoke test. Record the image digest and task revision. A successful Terraform apply is not proof that users can use the service."
            ],
            "bullets": [
              "Publish Terraform plan as a review artifact.",
              "Serialize production applies.",
              "Create concurrency controls.",
              "Define automatic and manual rollback paths."
            ]
          },
          {
            "heading": "Release evidence",
            "paragraphs": [
              "Store a summary of checks, artifact identifiers, deployment timing, and verification. Evidence makes future incidents and audits less dependent on memory."
            ]
          }
        ],
        "task": "Deploy a change from main and then roll it back using a known-good task revision.",
        "check": "The workflow proves external health and records exactly what reached production."
      }
    ],
    "quiz": [
      {
        "q": "What should happen before publishing an image?",
        "options": [
          "Tests and required checks pass",
          "The database becomes public",
          "Terraform state is deleted",
          "The task role gets administrator access"
        ],
        "answer": 0,
        "explain": "Failing code should be stopped before artifact publication and deployment."
      },
      {
        "q": "What is the main security benefit of GitHub OIDC?",
        "options": [
          "Temporary credentials without stored AWS keys",
          "Faster Redis reads",
          "Smaller Docker images",
          "Automatic PostgreSQL backups"
        ],
        "answer": 0,
        "explain": "OIDC enables short-lived role sessions tied to workflow identity."
      },
      {
        "q": "Does a successful terraform apply prove the service works?",
        "options": [
          "Yes, always",
          "No, run stability and smoke checks",
          "Only when Redis is empty",
          "Only on main branch"
        ],
        "answer": 1,
        "explain": "Infrastructure APIs may succeed while health checks or application behavior still fail."
      },
      {
        "q": "Why use deployment concurrency controls?",
        "options": [
          "To avoid overlapping production changes",
          "To add more public subnets",
          "To rotate Redis TTLs",
          "To increase image size"
        ],
        "answer": 0,
        "explain": "Overlapping applies or releases can race and make state and rollback unclear."
      }
    ]
  },
  {
    "id": 11,
    "title": "Observe the Platform",
    "track": "Observability",
    "icon": "📈",
    "duration": "8–13 hours",
    "xp": 240,
    "outcome": "Use logs, metrics, alarms, dashboards, and runbooks to detect impact and diagnose root causes.",
    "lessons": [
      {
        "title": "Logs with context",
        "minutes": 26,
        "summary": "Make events searchable across requests and services.",
        "sections": [
          {
            "heading": "Logs answer what happened",
            "paragraphs": [
              "Application logs should include consistent fields such as timestamp, level, request ID, route, status, latency, version, and safe error type. Infrastructure logs and ECS events complete the picture."
            ],
            "bullets": [
              "Propagate a request or correlation ID.",
              "Use severity levels consistently.",
              "Redact secrets and personal data.",
              "Set retention intentionally to control cost."
            ]
          },
          {
            "heading": "Logs are not metrics",
            "paragraphs": [
              "Logs are detailed events; metrics are numerical time series. Use each for its strength rather than deriving everything from expensive log queries."
            ]
          }
        ],
        "task": "Create a log query that finds all failures for one request ID and one release version.",
        "check": "You can trace a failed user request from ALB or application entry to the root error."
      },
      {
        "title": "Metrics and service health",
        "minutes": 30,
        "summary": "Measure user impact, saturation, traffic, and errors.",
        "sections": [
          {
            "heading": "Start with golden signals",
            "paragraphs": [
              "Track latency, traffic, errors, and saturation. Combine ALB metrics, ECS CPU and memory, task counts, Redis memory or evictions, database connections, and application-specific outcomes."
            ],
            "bullets": [
              "Prefer percentiles for latency.",
              "Measure successful business outcomes, not only HTTP 200.",
              "Distinguish client errors from server errors.",
              "Watch queues and connection pools before they saturate."
            ]
          },
          {
            "heading": "Dashboards should support decisions",
            "paragraphs": [
              "A dashboard should answer whether users are affected, where the problem is, and whether recovery is working. Avoid walls of charts without a diagnostic purpose."
            ]
          }
        ],
        "task": "Build an overview dashboard and a dependency dashboard.",
        "check": "Within two minutes you can identify whether an incident is traffic, application, Redis, database, or deployment related."
      },
      {
        "title": "Alarms and runbooks",
        "minutes": 28,
        "summary": "Alert on actionable conditions and document first response.",
        "sections": [
          {
            "heading": "An alarm needs an owner and action",
            "paragraphs": [
              "Alert fatigue grows when thresholds are noisy or unactionable. Prefer symptoms of user impact and sustained conditions. Every critical alarm should link to a runbook."
            ],
            "bullets": [
              "Describe meaning and likely causes.",
              "List immediate containment steps.",
              "Include useful commands and dashboards.",
              "State escalation and rollback criteria."
            ]
          },
          {
            "heading": "Test the detection path",
            "paragraphs": [
              "Create a controlled failure: return errors, exhaust a safe test pool, or deploy a bad health response in staging. Verify alarm delivery and the runbook."
            ]
          }
        ],
        "task": "Trigger one safe failure and follow the runbook from alert to recovery.",
        "check": "The alarm fires once, points to useful evidence, and recovery is measurable."
      }
    ],
    "quiz": [
      {
        "q": "Which four signals are a strong starting point?",
        "options": [
          "Latency, traffic, errors, saturation",
          "Tags, branches, colors, comments",
          "CIDR, Git, DNS, Dockerfile",
          "Users, invoices, commits, images"
        ],
        "answer": 0,
        "explain": "The golden signals cover user experience and resource pressure."
      },
      {
        "q": "Why include a release version in logs?",
        "options": [
          "To correlate failures with deployments",
          "To make Redis durable",
          "To create a VPC",
          "To replace request IDs"
        ],
        "answer": 0,
        "explain": "Version context helps identify whether failures began with a specific release."
      },
      {
        "q": "What makes an alarm useful?",
        "options": [
          "It has an owner and a clear action",
          "It fires every minute",
          "It monitors every possible metric",
          "It has no threshold"
        ],
        "answer": 0,
        "explain": "Actionable alarms reduce noise and accelerate response."
      },
      {
        "q": "Why test runbooks?",
        "options": [
          "Untested instructions may fail during real incidents",
          "To increase AWS cost",
          "To avoid dashboards",
          "To make containers stateful"
        ],
        "answer": 0,
        "explain": "A controlled drill validates access, commands, evidence, and recovery steps."
      }
    ]
  },
  {
    "id": 12,
    "title": "Scale and Deploy Safely",
    "track": "Reliability",
    "icon": "⚖️",
    "duration": "8–12 hours",
    "xp": 230,
    "outcome": "Configure autoscaling and deployment behavior that respond to demand while limiting downtime and failed releases.",
    "lessons": [
      {
        "title": "Choose a scaling signal",
        "minutes": 26,
        "summary": "Scale on a signal connected to demand or saturation.",
        "sections": [
          {
            "heading": "Target tracking",
            "paragraphs": [
              "ECS Service autoscaling can adjust desired task count to maintain a target metric such as average CPU. CPU is useful only when it correlates with load. Request count per target, memory, or queue depth may better reflect some services."
            ],
            "bullets": [
              "Set minimum capacity for availability.",
              "Set maximum capacity for cost and dependency safety.",
              "Allow scale-out quickly enough for demand.",
              "Avoid scale-in faster than the service can stabilize."
            ]
          },
          {
            "heading": "Scaling does not fix bottlenecks automatically",
            "paragraphs": [
              "More API tasks can overwhelm PostgreSQL connections, Redis memory, or a third-party rate limit. Capacity planning is end to end."
            ]
          }
        ],
        "task": "Select a scaling metric, justify it, and define min, max, target, and cooldowns.",
        "check": "A load test causes expected scale-out without exhausting downstream dependencies."
      },
      {
        "title": "Rolling update mechanics",
        "minutes": 28,
        "summary": "Understand how old and new tasks overlap.",
        "sections": [
          {
            "heading": "Availability during change",
            "paragraphs": [
              "Deployment percentages control how many tasks may be stopped or started during a rolling update. Health-check grace period, ALB deregistration delay, and application shutdown behavior all influence user impact."
            ],
            "bullets": [
              "New tasks must become healthy before old capacity disappears.",
              "Old targets need time to drain existing connections.",
              "Readiness should reflect the ability to receive traffic.",
              "Database migrations must tolerate version overlap."
            ]
          },
          {
            "heading": "Circuit breaker",
            "paragraphs": [
              "A deployment circuit breaker can stop a rollout that never reaches steady state and optionally roll back to the previous service deployment."
            ]
          }
        ],
        "task": "Deploy a version with a longer startup and tune grace and draining behavior safely.",
        "check": "Requests continue successfully while old and new revisions overlap."
      },
      {
        "title": "Load and failure testing",
        "minutes": 30,
        "summary": "Measure behavior instead of trusting configuration.",
        "sections": [
          {
            "heading": "Define a test scenario",
            "paragraphs": [
              "Start with expected concurrency, request mix, payloads, and success criteria. Observe latency percentiles, error rates, task count, CPU, memory, database connections, and cache behavior."
            ],
            "bullets": [
              "Warm-up before measurement.",
              "Test step increases, not only instant spikes.",
              "Record the first bottleneck.",
              "Stop before unsafe spend or dependency impact."
            ]
          },
          {
            "heading": "Reliability is a feedback loop",
            "paragraphs": [
              "Use test results to adjust application efficiency, task sizing, scaling, pooling, and limits. The goal is predictable behavior, not the largest possible number."
            ]
          }
        ],
        "task": "Run a bounded load test and write a one-page capacity finding.",
        "check": "You know the current safe operating range and the next limiting dependency."
      }
    ],
    "quiz": [
      {
        "q": "What should an autoscaling metric represent?",
        "options": [
          "Demand or saturation relevant to the service",
          "The developer’s favorite number",
          "Only deployment count",
          "Only Git history"
        ],
        "answer": 0,
        "explain": "A scaling signal should correlate with the need for more or less capacity."
      },
      {
        "q": "Why set a maximum task count?",
        "options": [
          "To bound cost and protect dependencies",
          "To prevent all deployments",
          "To make tasks public",
          "To remove health checks"
        ],
        "answer": 0,
        "explain": "Unbounded scaling can create cost spikes and overload databases or external services."
      },
      {
        "q": "What does connection draining protect?",
        "options": [
          "In-flight requests on targets being removed",
          "Terraform state",
          "Docker build cache",
          "Redis keys from TTL"
        ],
        "answer": 0,
        "explain": "Draining allows existing connections to finish before the old task is terminated."
      },
      {
        "q": "Can adding API tasks overload PostgreSQL?",
        "options": [
          "Yes, total connection demand can rise",
          "No, never",
          "Only if Cloudflare is absent",
          "Only with one subnet"
        ],
        "answer": 0,
        "explain": "Scaling one tier can move or amplify pressure on downstream tiers."
      }
    ]
  },
  {
    "id": 13,
    "title": "Harden Production",
    "track": "Security",
    "icon": "🛡️",
    "duration": "10–15 hours",
    "xp": 270,
    "outcome": "Reduce public surface, permission scope, secret exposure, software risk, and component blast radius.",
    "lessons": [
      {
        "title": "TLS and public surface",
        "minutes": 28,
        "summary": "Expose only the entry points users need.",
        "sections": [
          {
            "heading": "Encrypt public traffic",
            "paragraphs": [
              "Use a managed certificate for the public domain and redirect or reject plain HTTP according to policy. Keep tasks, Redis, and PostgreSQL private. If Cloudflare sits in front, configure origin security deliberately rather than assuming the edge makes the origin private."
            ],
            "bullets": [
              "Public: edge and ALB HTTPS listener.",
              "Private: ECS tasks, cache, and database.",
              "Restrict administrative access paths.",
              "Use security headers appropriate to the application."
            ]
          },
          {
            "heading": "Origin exposure",
            "paragraphs": [
              "An attacker may bypass the edge if the origin is openly reachable and known. Consider origin authentication, restricted ingress ranges where maintainable, and application-layer controls."
            ]
          }
        ],
        "task": "Create a public-surface inventory and remove unnecessary listeners or public addresses.",
        "check": "Only required HTTPS endpoints are reachable from the public internet."
      },
      {
        "title": "IAM and secret review",
        "minutes": 30,
        "summary": "Audit effective access rather than policy names.",
        "sections": [
          {
            "heading": "Trace each permission",
            "paragraphs": [
              "Review what the task, execution, CI, and human roles can actually do. Broad wildcards may be expedient but increase blast radius. Scope actions and resources and add conditions when practical."
            ],
            "bullets": [
              "Application reads only required secrets.",
              "Execution role cannot access business data.",
              "CI cannot assume production role from untrusted refs.",
              "Human access is logged and reviewed."
            ]
          },
          {
            "heading": "Rotation and failure",
            "paragraphs": [
              "Document how secrets rotate, how applications receive new values, and what happens to existing connections. Test one rotation in staging."
            ]
          }
        ],
        "task": "Produce a role-to-permission review and rotate a nonproduction secret.",
        "check": "No role has unexplained broad access, and secret rotation does not require rebuilding the image."
      },
      {
        "title": "Software and runtime hardening",
        "minutes": 28,
        "summary": "Reduce known vulnerabilities and unsafe defaults.",
        "sections": [
          {
            "heading": "Layered controls",
            "paragraphs": [
              "Scan dependencies and images, patch base images, run non-root, use read-only filesystems where compatible, and avoid unnecessary Linux capabilities. Validate input and set request size and timeout limits."
            ],
            "bullets": [
              "Create a vulnerability remediation SLA.",
              "Review third-party packages.",
              "Limit outbound access when practical.",
              "Protect logs from sensitive content."
            ]
          },
          {
            "heading": "Threat modeling",
            "paragraphs": [
              "Choose a few realistic threats—credential theft, SSRF, injection, dependency compromise, public database exposure—and map prevention, detection, and recovery controls."
            ]
          }
        ],
        "task": "Run a lightweight threat model and remediate the highest-risk finding.",
        "check": "The architecture document includes threats, controls, owners, and residual risk."
      }
    ],
    "quiz": [
      {
        "q": "Which components should normally be publicly reachable?",
        "options": [
          "Only required edge/ALB HTTPS entry points",
          "Redis and PostgreSQL",
          "Every ECS task",
          "Terraform backend"
        ],
        "answer": 0,
        "explain": "The application entry point should be public; internal compute and data tiers should remain private."
      },
      {
        "q": "Should secret rotation require rebuilding the image?",
        "options": [
          "No, secrets should be runtime configuration",
          "Yes, always",
          "Only for Redis",
          "Only in one zone"
        ],
        "answer": 0,
        "explain": "Runtime secret injection separates credentials from immutable application artifacts."
      },
      {
        "q": "Why review effective IAM access?",
        "options": [
          "Policy names may hide broad actions or resources",
          "To improve CSS",
          "To add cache keys",
          "To shorten health checks"
        ],
        "answer": 0,
        "explain": "Security depends on actual permissions and trust policies, not friendly policy names."
      },
      {
        "q": "What is threat modeling for?",
        "options": [
          "Connecting realistic threats to controls and residual risk",
          "Replacing all tests",
          "Creating subnets automatically",
          "Increasing task CPU"
        ],
        "answer": 0,
        "explain": "Threat modeling prioritizes security work based on plausible attack paths and impact."
      }
    ]
  },
  {
    "id": 14,
    "title": "Control Cost",
    "track": "FinOps",
    "icon": "💸",
    "duration": "5–8 hours",
    "xp": 170,
    "outcome": "Estimate, measure, tag, and reduce cloud costs while preserving the reliability requirements you chose.",
    "lessons": [
      {
        "title": "Know the baseline",
        "minutes": 24,
        "summary": "Identify resources that charge even when traffic is low.",
        "sections": [
          {
            "heading": "Fixed and variable components",
            "paragraphs": [
              "A learning environment can accumulate cost from NAT gateways, load balancers, database instances, cache nodes, logs, storage, and running Fargate tasks even with little traffic. Build an estimate before apply and compare it with actual billing data."
            ],
            "bullets": [
              "List hourly or monthly baseline resources.",
              "Estimate data processing and egress.",
              "Include backups, logs, and idle storage.",
              "Set alerts below your maximum acceptable spend."
            ]
          },
          {
            "heading": "Cost follows architecture",
            "paragraphs": [
              "High availability, private networking, managed data services, and retention improve reliability or security but have cost. Make trade-offs explicit by environment."
            ]
          }
        ],
        "task": "Create a monthly cost model for development and production-shaped configurations.",
        "check": "The estimate names assumptions and identifies the three largest cost drivers."
      },
      {
        "title": "Right-size and schedule",
        "minutes": 24,
        "summary": "Remove waste without hiding operational risk.",
        "sections": [
          {
            "heading": "Measure before shrinking",
            "paragraphs": [
              "Use CPU, memory, connection, and latency data to adjust task sizing and desired count. Development data services may be stopped, downsized, or recreated depending on durability needs."
            ],
            "bullets": [
              "Reduce log retention in nonproduction.",
              "Expire old images and snapshots intentionally.",
              "Scale development tasks to zero outside learning sessions where appropriate.",
              "Evaluate NAT versus endpoints with real traffic assumptions."
            ]
          },
          {
            "heading": "Tagging enables accountability",
            "paragraphs": [
              "Use consistent project, environment, owner, and cost-center tags. Untagged shared charges are difficult to understand and optimize."
            ]
          }
        ],
        "task": "Implement tags and one automated nonproduction shutdown or scale-down routine.",
        "check": "You can attribute major charges and know what is safe to turn off."
      },
      {
        "title": "Destroy safely",
        "minutes": 22,
        "summary": "Make teardown repeatable without losing important evidence.",
        "sections": [
          {
            "heading": "Teardown order and protection",
            "paragraphs": [
              "Persistent resources may have deletion protection, final snapshots, retained backups, or dependencies. A safe teardown identifies what must be exported, what must be preserved, and what can be recreated."
            ],
            "bullets": [
              "Export progress and release records.",
              "Snapshot or intentionally discard databases.",
              "Scale services down before deletion when useful.",
              "Review the destroy plan like any production change."
            ]
          },
          {
            "heading": "A sandbox is successful when it can disappear",
            "paragraphs": [
              "Reproducibility means you can remove the environment and rebuild it from source, state strategy, secrets, and documentation."
            ]
          }
        ],
        "task": "Perform a controlled teardown and recreate at least the network and service skeleton.",
        "check": "No surprise resources remain, and the project can be rebuilt from documented steps."
      }
    ],
    "quiz": [
      {
        "q": "Which resources can create noticeable idle baseline cost?",
        "options": [
          "NAT, ALB, managed database/cache, running tasks",
          "Only Git commits",
          "Only Python files",
          "Only DNS comments"
        ],
        "answer": 0,
        "explain": "Managed networking, compute, and data services can charge even at low traffic."
      },
      {
        "q": "Why use consistent cost tags?",
        "options": [
          "To attribute and analyze spending",
          "To encrypt traffic",
          "To create Docker layers",
          "To replace IAM"
        ],
        "answer": 0,
        "explain": "Tags let billing tools group charges by project, environment, or owner."
      },
      {
        "q": "Should you right-size without measurements?",
        "options": [
          "No, use utilization and performance data",
          "Yes, always choose the smallest",
          "Only if Redis is empty",
          "Only before Terraform init"
        ],
        "answer": 0,
        "explain": "Measurements reveal whether smaller capacity preserves reliability."
      },
      {
        "q": "What makes teardown safe?",
        "options": [
          "Reviewing data retention, dependencies, and destroy plan",
          "Deleting state first",
          "Making databases public",
          "Removing all logs immediately"
        ],
        "answer": 0,
        "explain": "Safe teardown protects required data and prevents orphaned or unexpected resources."
      }
    ]
  },
  {
    "id": 15,
    "title": "Ship the Capstone",
    "track": "Capstone",
    "icon": "🏆",
    "duration": "12–20 hours",
    "xp": 400,
    "outcome": "Release, demonstrate, recover, document, and compare the complete platform with a mature DevOps-managed environment.",
    "lessons": [
      {
        "title": "Production release checklist",
        "minutes": 30,
        "summary": "Turn many components into one controlled release decision.",
        "sections": [
          {
            "heading": "Pre-release evidence",
            "paragraphs": [
              "A release checklist should confirm tests, image scanning, Terraform plan review, database compatibility, backups, alarms, rollback artifact, change owner, and smoke tests. It prevents knowledge from living only in one person’s head."
            ],
            "bullets": [
              "Record commit and image digest.",
              "Record task definition revision.",
              "Verify health and user journey.",
              "Confirm dashboards and alerts.",
              "Name the rollback target."
            ]
          },
          {
            "heading": "Definition of done",
            "paragraphs": [
              "Done means the service is usable, observable, recoverable, and documented—not merely that the deployment command returned success."
            ]
          }
        ],
        "task": "Execute a tagged release using your checklist and publish a release record.",
        "check": "Another engineer can identify what changed, verify it, and roll it back from the record."
      },
      {
        "title": "Recovery drills",
        "minutes": 32,
        "summary": "Prove that failure handling works under controlled conditions.",
        "sections": [
          {
            "heading": "Choose representative failures",
            "paragraphs": [
              "Stop a task, deploy an unhealthy revision, make Redis unavailable briefly in staging, and restore a database snapshot or test backup. Measure detection and recovery time."
            ],
            "bullets": [
              "Do not run destructive drills without scope and rollback.",
              "Capture ECS events, alarms, logs, and timelines.",
              "Update runbooks with every surprise.",
              "Separate service recovery from data recovery."
            ]
          },
          {
            "heading": "Learning from recovery",
            "paragraphs": [
              "A drill is successful when it reveals a weakness safely. Do not optimize for a perfect demonstration; optimize for better systems and documentation afterward."
            ]
          }
        ],
        "task": "Run two failure drills and write a short incident review for each.",
        "check": "Detection, containment, recovery, and follow-up actions are documented with evidence."
      },
      {
        "title": "Compare and present",
        "minutes": 34,
        "summary": "Explain trade-offs against the company platform and Cloudflare-first alternatives.",
        "sections": [
          {
            "heading": "Solo build versus DevOps platform",
            "paragraphs": [
              "Your build can reproduce the major functional path: container registry, task definition, service reconciliation, load balancing, private data, Terraform, CI/CD, monitoring, scaling, and security. A mature DevOps team likely adds reusable modules, policy enforcement, centralized networking, identity governance, multi-environment promotion, incident rotations, compliance, and organizational support."
            ],
            "bullets": [
              "List what is functionally equivalent.",
              "List what is simplified.",
              "List organizational controls you cannot reproduce alone.",
              "Explain why ECS was chosen before EKS."
            ]
          },
          {
            "heading": "AWS and Cloudflare can complement each other",
            "paragraphs": [
              "Cloudflare is strong at the edge; AWS ECS is strong for conventional containerized backends and deep AWS data-service integration. The best comparison is workload-specific, and a hybrid architecture is common."
            ]
          }
        ],
        "task": "Record a 10-minute architecture presentation and answer five anticipated review questions.",
        "check": "You can defend the design, costs, risks, alternatives, and next improvements without reading a script."
      }
    ],
    "quiz": [
      {
        "q": "What should a release record include?",
        "options": [
          "Commit, image digest, task revision, checks, rollback target",
          "Only the developer name",
          "Only the domain",
          "Only the Terraform version"
        ],
        "answer": 0,
        "explain": "A release record should connect source, artifact, deployment, verification, and rollback."
      },
      {
        "q": "What is the purpose of a recovery drill?",
        "options": [
          "Reveal weaknesses safely and improve response",
          "Prove failures are impossible",
          "Increase baseline cost",
          "Avoid documenting incidents"
        ],
        "answer": 0,
        "explain": "Controlled drills validate detection, access, runbooks, and recovery mechanisms."
      },
      {
        "q": "What might a mature DevOps platform add beyond a solo implementation?",
        "options": [
          "Reusable modules, policies, governance, and operational support",
          "Only more Dockerfiles",
          "A public database",
          "No monitoring"
        ],
        "answer": 0,
        "explain": "Organizational platforms include standardization and controls beyond basic technical functionality."
      },
      {
        "q": "Why might ECS be chosen before EKS for this project?",
        "options": [
          "It delivers container orchestration with less Kubernetes operational overhead",
          "It cannot run containers",
          "It removes IAM",
          "It is a database"
        ],
        "answer": 0,
        "explain": "ECS Fargate provides the required container capabilities with a smaller operational surface for one learner."
      }
    ]
  }
];
